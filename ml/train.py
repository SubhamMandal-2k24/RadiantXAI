"""
Training loop for ChestXrayResNet (multi-label classification).
Designed to run in short bursts with checkpointing, so training can
be resumed across multiple Kaggle sessions instead of needing one
long uninterrupted run. Epoch count per run is configurable via
--epochs so training can be done in controlled chunks.
"""

import os
import argparse
import torch
import mlflow
from torch.utils.data import DataLoader
from torchvision import transforms
from torch.optim.lr_scheduler import ReduceLROnPlateau

from ml.datasets.chestxray_dataset import ChestXrayDataset, LABELS
from ml.models.resnet_multilabel import ChestXrayResNet
from ml.losses.weighted_bce import WeightedBCELoss, compute_pos_weights

# ---- Config ----
ROOT_DIR = "/kaggle/input/datasets/nih-chest-xrays/data"
TRAIN_CSV = "/kaggle/working/RadiantXAI/data/splits/train.csv"
VAL_CSV = "/kaggle/working/RadiantXAI/data/splits/val.csv"
CHECKPOINT_PATH = "/kaggle/working/checkpoint.pth"
BATCH_SIZE = 32
LEARNING_RATE = 1e-4
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=5,
                        help="Number of epochs to train THIS run")
    return parser.parse_args()


def get_transforms():
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                              std=[0.229, 0.224, 0.225]),
    ])


def save_checkpoint(model, optimizer, scheduler, epoch):
    torch.save({
        "model_state": model.state_dict(),
        "optimizer_state": optimizer.state_dict(),
        "scheduler_state": scheduler.state_dict(),
        "epoch": epoch,
    }, CHECKPOINT_PATH)
    print(f"Checkpoint saved at epoch {epoch} -> {CHECKPOINT_PATH}")


def load_checkpoint_if_exists(model, optimizer, scheduler):
    start_epoch = 0
    if os.path.exists(CHECKPOINT_PATH):
        print(f"Found checkpoint at {CHECKPOINT_PATH}, resuming...")
        checkpoint = torch.load(CHECKPOINT_PATH, map_location=DEVICE)
        model.load_state_dict(checkpoint["model_state"])
        optimizer.load_state_dict(checkpoint["optimizer_state"])
        scheduler.load_state_dict(checkpoint["scheduler_state"])
        start_epoch = checkpoint["epoch"] + 1
        print(f"Resuming from epoch {start_epoch}")
    else:
        print("No checkpoint found, starting fresh.")
    return start_epoch


def train_one_epoch(model, loader, loss_fn, optimizer, epoch):
    model.train()
    running_loss = 0.0
    for batch_idx, (images, labels) in enumerate(loader):
        images, labels = images.to(DEVICE), labels.to(DEVICE)

        optimizer.zero_grad()
        logits = model(images)
        loss = loss_fn(logits, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        if batch_idx % 50 == 0:
            print(f"Epoch {epoch} | Batch {batch_idx}/{len(loader)} | Loss: {loss.item():.4f}")

    avg_loss = running_loss / len(loader)
    return avg_loss


def validate(model, loader, loss_fn):
    model.eval()
    running_loss = 0.0
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            logits = model(images)
            loss = loss_fn(logits, labels)
            running_loss += loss.item()
    return running_loss / len(loader)


def main():
    args = parse_args()
    num_epochs_this_run = args.epochs

    print(f"Using device: {DEVICE}")
    transform = get_transforms()

    train_dataset = ChestXrayDataset(TRAIN_CSV, ROOT_DIR, transform=transform)
    val_dataset = ChestXrayDataset(VAL_CSV, ROOT_DIR, transform=transform)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

    label_counts = torch.tensor(train_dataset.df[LABELS].sum().values, dtype=torch.float32)
    pos_weight = compute_pos_weights(label_counts, total_samples=len(train_dataset)).to(DEVICE)

    model = ChestXrayResNet().to(DEVICE)
    loss_fn = WeightedBCELoss(pos_weight=pos_weight)
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=1)

    start_epoch = load_checkpoint_if_exists(model, optimizer, scheduler)

    mlflow.set_experiment("radiantxai-resnet50")
    with mlflow.start_run():
        mlflow.log_params({
            "batch_size": BATCH_SIZE,
            "learning_rate": LEARNING_RATE,
            "num_epochs_this_run": num_epochs_this_run,
            "start_epoch": start_epoch,
        })

        for epoch in range(start_epoch, start_epoch + num_epochs_this_run):
            train_loss = train_one_epoch(model, train_loader, loss_fn, optimizer, epoch)
            val_loss = validate(model, val_loader, loss_fn)

            print(f"Epoch {epoch} done | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")
            mlflow.log_metric("train_loss", train_loss, step=epoch)
            mlflow.log_metric("val_loss", val_loss, step=epoch)

            scheduler.step(val_loss)
            current_lr = optimizer.param_groups[0]['lr']
            print(f"Current learning rate: {current_lr}")
            mlflow.log_metric("learning_rate", current_lr, step=epoch)

            save_checkpoint(model, optimizer, scheduler, epoch)

    print("Training run complete.")


if __name__ == "__main__":
    main()