"""
PyTorch Dataset for ChestX-ray14 multi-label classification.
Reads from the patient-level split CSVs produced by make_splits.py.

Images are physically split across multiple folders
(images_001/images/, images_002/images/, ...) rather than one flat
folder, so we build a filename -> full_path lookup once at init time
instead of searching per-image during training (which would be slow).
"""

import os
import pandas as pd
from PIL import Image
from torch.utils.data import Dataset

LABELS = [
    "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", "Mass",
    "Nodule", "Pneumonia", "Pneumothorax", "Consolidation", "Edema",
    "Emphysema", "Fibrosis", "Pleural_Thickening", "Hernia",
]


def build_image_path_lookup(root_dir: str) -> dict:
    """
    Scans root_dir (e.g. '/kaggle/input/datasets/nih-chest-xrays/data')
    for all images_XXX/images/ subfolders and builds a
    {filename: full_path} dictionary for fast lookup.
    """
    lookup = {}
    for entry in os.listdir(root_dir):
        images_subdir = os.path.join(root_dir, entry, "images")
        if os.path.isdir(images_subdir):
            for fname in os.listdir(images_subdir):
                lookup[fname] = os.path.join(images_subdir, fname)
    return lookup


class ChestXrayDataset(Dataset):
    def __init__(self, csv_path: str, root_dir: str, transform=None):
        self.df = pd.read_csv(csv_path)
        self.transform = transform
        self.path_lookup = build_image_path_lookup(root_dir)

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        filename = row["Image Index"]
        img_path = self.path_lookup[filename]

        image = Image.open(img_path).convert("RGB")

        if self.transform:
            image = self.transform(image)

        labels = row[LABELS].values.astype("float32")
        return image, labels