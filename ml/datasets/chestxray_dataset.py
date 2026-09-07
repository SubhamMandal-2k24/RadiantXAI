"""
PyTorch Dataset for ChestX-ray14 multi-label classification.
Reads from the patient-level split CSVs produced by make_splits.py.
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


class ChestXrayDataset(Dataset):
    def __init__(self, csv_path: str, image_dir: str, transform=None):
        self.df = pd.read_csv(csv_path)
        self.image_dir = image_dir
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = os.path.join(self.image_dir, row["Image Index"])
        image = Image.open(img_path).convert("RGB")

        if self.transform:
            image = self.transform(image)

        labels = row[LABELS].values.astype("float32")
        return image, labels