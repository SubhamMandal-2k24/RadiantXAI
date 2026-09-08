"""
Training loop for ChestXrayResNet (multi-label classification).
Designed to run in short bursts with checkpointing, so training can
be resumed across multiple Kaggle sessions instead of needing one
long uninterrupted run.
"""

import os
import torch
import mlflow
from torch.utils.data import DataLoader
from torchvision import transforms

from ml.datasets.chestxray_dataset import ChestXrayDataset, LABELS
from ml.models.resnet_multilabel import ChestXrayResNet
from ml.losses.weighted_bce import WeightedBCELoss, compute_pos_weights

# ---- Config ----
ROOT_DIR = "/kaggle/input/datasets/nih-chest-xrays/data"
TRAIN_CSV = "data/splits/train.csv"
VAL_CSV = "data/splits/val.csv"
CHECKPOINT_PATH = "/kaggle/working/checkpoint.pth"
BATCH_SIZE = 32
NUM_EPOCHS = 2          # small run to start; increase later to continue
LEARNING_RATE = 1e-4
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def get_transforms():
    # Standard ImageNet normalization, since ResNet-50 was pretrained on it
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                              std=[0.229, 0.224, 0.225]),
    ])


def load_checkpoint_if_exists(model, optimizer):
    start_epoch = 0
    if os.path.exists(CHECKPOINT_PATH):
        print(f"Found checkpoint at {CHECKPOINT_PATH}, resuming...")
        checkpoint = torch.load(CHECKPOINT_PATH, map_location=DEVICE)
        model.load_state_dict(checkpoint["model_state"])
        optimizer.load_state_dict(checkpoint["optimizer_state"])
        start_epoch = checkpoint["epoch"] + 1
        print(f"Resuming from epoch {start_epoch}")
    else:
        print("No checkpoint found, starting fresh.")
    return start_epoch


def save_checkpoint(model, optimizer, epoch):
    torch.save({
        "model_state": model.state_dict(),
        "optimizer_state": optimizer.state_dict(),
        "epoch": epoch,
    }, CHECKPOINT_PATH)
    print(f"Checkpoint saved at epoch {epoch} -> {CHECKPOINT_PATH}")


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
    print(f"Using device: {DEVICE}")
    transform = get_transforms()

    train_dataset = ChestXrayDataset(TRAIN_CSV, ROOT_DIR, transform=transform)
    val_dataset = ChestXrayDataset(VAL_CSV, ROOT_DIR, transform=transform)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

    # Compute per-class pos_weight from the training set's actual label counts
    label_counts = torch.tensor(train_dataset.df[LABELS].sum().values, dtype=torch.float32)
    pos_weight = compute_pos_weights(label_counts, total_samples=len(train_dataset)).to(DEVICE)

    model = ChestXrayResNet().to(DEVICE)
    loss_fn = WeightedBCELoss(pos_weight=pos_weight)
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)

    start_epoch = load_checkpoint_if_exists(model, optimizer)

    mlflow.set_experiment("radiantxai-resnet50")
    with mlflow.start_run():
        mlflow.log_params({
            "batch_size": BATCH_SIZE,
            "learning_rate": LEARNING_RATE,
            "num_epochs_this_run": NUM_EPOCHS,
            "start_epoch": start_epoch,
        })

        for epoch in range(start_epoch, start_epoch + NUM_EPOCHS):
            train_loss = train_one_epoch(model, train_loader, loss_fn, optimizer, epoch)
            val_loss = validate(model, val_loader, loss_fn)

            print(f"Epoch {epoch} done | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")
            mlflow.log_metric("train_loss", train_loss, step=epoch)
            mlflow.log_metric("val_loss", val_loss, step=epoch)

            save_checkpoint(model, optimizer, epoch)

    print("Training run complete.")


if __name__ == "__main__":
    main()