"""
Generates patient-level train/val/test splits for ChestX-ray14.

Why patient-level: multiple images can belong to the same patient
(see 'Follow-up #' column). Splitting by image instead of by patient
lets the same patient's scans leak across train/val/test, inflating
reported metrics. We split by Patient ID so a patient appears in
exactly one split.
"""

import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

RAW_CSV = "data/raw/Data_Entry_2017.csv"
OUT_DIR = "data/splits"

# The 14 official pathology labels (excludes "No Finding")
LABELS = [
    "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", "Mass",
    "Nodule", "Pneumonia", "Pneumothorax", "Consolidation", "Edema",
    "Emphysema", "Fibrosis", "Pleural_Thickening", "Hernia",
]


def load_and_encode(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    # drop the unnamed trailing column from the CSV's trailing comma
    df = df.loc[:, ~df.columns.str.contains("^Unnamed")]

    # multi-hot encode the pipe-separated Finding Labels
    for label in LABELS:
        df[label] = df["Finding Labels"].apply(
            lambda x: 1 if label in x.split("|") else 0
        )

    return df


def patient_level_split(df: pd.DataFrame, seed: int = 42):
    # 80% train, 10% val, 10% test, grouped by Patient ID
    gss1 = GroupShuffleSplit(n_splits=1, train_size=0.8, random_state=seed)
    train_idx, temp_idx = next(gss1.split(df, groups=df["Patient ID"]))

    train_df = df.iloc[train_idx]
    temp_df = df.iloc[temp_idx]

    gss2 = GroupShuffleSplit(n_splits=1, train_size=0.5, random_state=seed)
    val_idx, test_idx = next(gss2.split(temp_df, groups=temp_df["Patient ID"]))

    val_df = temp_df.iloc[val_idx]
    test_df = temp_df.iloc[test_idx]

    return train_df, val_df, test_df


def sanity_check_no_leakage(train_df, val_df, test_df):
    train_ids = set(train_df["Patient ID"])
    val_ids = set(val_df["Patient ID"])
    test_ids = set(test_df["Patient ID"])

    assert train_ids.isdisjoint(val_ids), "Leakage: train/val share patients"
    assert train_ids.isdisjoint(test_ids), "Leakage: train/test share patients"
    assert val_ids.isdisjoint(test_ids), "Leakage: val/test share patients"
    print("No patient-level leakage confirmed across splits.")


def main():
    df = load_and_encode(RAW_CSV)
    train_df, val_df, test_df = patient_level_split(df)
    sanity_check_no_leakage(train_df, val_df, test_df)

    print(f"Train: {len(train_df)} images, {train_df['Patient ID'].nunique()} patients")
    print(f"Val:   {len(val_df)} images, {val_df['Patient ID'].nunique()} patients")
    print(f"Test:  {len(test_df)} images, {test_df['Patient ID'].nunique()} patients")

    train_df.to_csv(f"{OUT_DIR}/train.csv", index=False)
    val_df.to_csv(f"{OUT_DIR}/val.csv", index=False)
    test_df.to_csv(f"{OUT_DIR}/test.csv", index=False)
    print(f"Splits written to {OUT_DIR}/")


if __name__ == "__main__":
    main()