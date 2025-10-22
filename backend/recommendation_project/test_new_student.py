import pandas as pd
import numpy as np
import joblib
from sklearn.metrics.pairwise import cosine_similarity
import os
import re

# ---------- STEP 0: Paths ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "datasets")
MODELS_DIR = os.path.join(BASE_DIR, "models")

# ---------- STEP 1: Load saved model ----------
vectorizer = joblib.load(os.path.join(MODELS_DIR, "tfidf_vectorizer.joblib"))
event_vectors = np.load(os.path.join(MODELS_DIR, "similarity_matrix.npy"))  # old similarity matrix, only structure used
events = pd.read_csv(os.path.join(DATASET_DIR, "events_mock.csv"))
clubs = pd.read_csv(os.path.join(DATASET_DIR, "clubs_mock.csv"))

# Clean column names
for df in [events, clubs]:
    df.columns = df.columns.str.strip().str.lower()

# Merge club info
events = events.merge(clubs, on="club_id", how="left")

# Determine dept column
if "dept" in events.columns:
    dept_col = "dept"
elif "dept_x" in events.columns:
    dept_col = "dept_x"
elif "dept_y" in events.columns:
    dept_col = "dept_y"
else:
    dept_col = None

# Clean text columns
def clean_text(text):
    if pd.isna(text):
        return ""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s,]', '', text)
    text = text.strip()
    return text

for col in ["title", "description", "tags", "club_name"]:
    if col in events.columns:
        events[col] = events[col].apply(clean_text)
if dept_col:
    events[dept_col] = events[dept_col].apply(clean_text)

# Combine event text
events["combined_features"] = (
    events.get("title", "") + " " +
    events.get("description", "") + " " +
    events.get("tags", "") + " " +
    (events.get(dept_col, "") if dept_col else "") + " " +
    events.get("club_name", "")
)

# Vectorize events using the same vectorizer
event_vectors = vectorizer.transform(events["combined_features"])

# ---------- STEP 2: Ask user for new student info ----------
print("👋 Enter your details to get recommended events!")
new_interests = input("Enter your interests (comma-separated): ").strip()
new_dept = input("Enter your department: ").strip()

# Clean input
new_profile_text = clean_text(new_interests + " " + new_dept)

# Vectorize new student
new_student_vector = vectorizer.transform([new_profile_text])

# ---------- STEP 3: Compute similarity ----------
similarity_scores = cosine_similarity(new_student_vector, event_vectors)[0]

# ---------- STEP 4: Top-N recommendations ----------
top_n = 5
top_indices = similarity_scores.argsort()[::-1][:top_n]

print(f"\n🎯 Top-{top_n} event recommendations for you:")
for idx in top_indices:
    event = events.iloc[idx]
    dept_info = f" ({event[dept_col]})" if dept_col else ""
    print(f"  → {event['title']}{dept_info} [{event['tags']}]")
