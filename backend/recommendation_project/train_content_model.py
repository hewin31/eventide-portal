# train_content_model.py

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import joblib
import os
import re

# ---------- STEP 0: Set dataset path ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "datasets")

# ---------- STEP 1: Load datasets ----------
students = pd.read_csv(os.path.join(DATASET_DIR, "students_mock.csv"))
events = pd.read_csv(os.path.join(DATASET_DIR, "events_mock.csv"))
clubs = pd.read_csv(os.path.join(DATASET_DIR, "clubs_mock.csv"))
interactions = pd.read_csv(os.path.join(DATASET_DIR, "interactions_mock.csv"))

print("✅ Datasets loaded successfully!")

# ---------- STEP 1b: Clean column names ----------
for df in [students, events, clubs, interactions]:
    df.columns = df.columns.str.strip().str.lower()

# ---------- STEP 2: Merge events + clubs ----------
events = events.merge(clubs, on="club_id", how="left")

# Determine which dept column to use after merge
if "dept" in events.columns:
    dept_col = "dept"
elif "dept_x" in events.columns:
    dept_col = "dept_x"
elif "dept_y" in events.columns:
    dept_col = "dept_y"
else:
    dept_col = None

# ---------- STEP 3: Text cleaning ----------
def clean_text(text):
    if pd.isna(text):
        return ""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s,]', '', text)
    text = text.strip()
    return text

# Clean events text fields
for col in ["title", "description", "tags", "club_name"]:
    if col in events.columns:
        events[col] = events[col].apply(clean_text)

if dept_col:
    events[dept_col] = events[dept_col].apply(clean_text)

# Combine text features for TF-IDF
events["combined_features"] = (
    events.get("title", "") + " " +
    events.get("description", "") + " " +
    events.get("tags", "") + " " +
    (events.get(dept_col, "") if dept_col else "") + " " +
    events.get("club_name", "")
)

# ---------- STEP 4: TF-IDF Vectorization ----------
vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
event_vectors = vectorizer.fit_transform(events["combined_features"])

# ---------- STEP 5: Build student profiles ----------
students["interests"] = students["interests"].apply(clean_text)
students["dept"] = students["dept"].apply(clean_text)
students["profile_text"] = students["interests"] + " " + students["dept"]

student_vectors = vectorizer.transform(students["profile_text"])

print("✅ TF-IDF vectors created for events and students!")

# ---------- STEP 6: Compute similarity ----------
similarity_matrix = cosine_similarity(student_vectors, event_vectors)
print("✅ Similarity matrix computed!")

# ---------- STEP 7: Generate Top-N recommendations ----------
top_n = 5
recommendations = {}

for i, student_id in enumerate(students["student_id"]):
    sim_scores = list(enumerate(similarity_matrix[i]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[:top_n]
    event_indices = [idx for idx, score in sim_scores]
    
    if dept_col:
        recommended_events = events.iloc[event_indices][["event_id", "title", dept_col, "tags"]]
    else:
        recommended_events = events.iloc[event_indices][["event_id", "title", "tags"]]

    recommendations[student_id] = recommended_events.to_dict(orient="records")

# ---------- STEP 8: Display sample recommendations ----------
sample_student = students.iloc[0]["student_id"]
print(f"\n🎯 Top-{top_n} recommendations for Student ID {sample_student}:")
for rec in recommendations[sample_student]:
    if dept_col:
        print(f"  → {rec['title']} ({rec[dept_col]}) [{rec['tags']}]")
    else:
        print(f"  → {rec['title']} [{rec['tags']}]")

# ---------- STEP 9: Save model artifacts ----------
os.makedirs(os.path.join(BASE_DIR, "models"), exist_ok=True)
joblib.dump(vectorizer, os.path.join(BASE_DIR, "models", "tfidf_vectorizer.joblib"))
np.save(os.path.join(BASE_DIR, "models", "similarity_matrix.npy"), similarity_matrix)

print("\n💾 Model and vectorizer saved successfully!")
print("🚀 Training pipeline complete.")
