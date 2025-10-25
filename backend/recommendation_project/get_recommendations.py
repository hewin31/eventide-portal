# backend/recommendation_project/get_recommendations.py

import pandas as pd
import numpy as np
import joblib
from sklearn.metrics.pairwise import cosine_similarity
import os
import re
import sys
import json

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "datasets")
MODELS_DIR = os.path.join(BASE_DIR, "models")
TOP_N = 10  # Number of recommendations to generate

# --- Text Cleaning Function ---
def clean_text(text):
    if pd.isna(text):
        return ""
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9\s,]', '', text)
    return text.strip()

def get_recommendations(user_interests, user_department):
    try:
        # --- Step 1: Load Model and Event Data ---
        vectorizer = joblib.load(os.path.join(MODELS_DIR, "tfidf_vectorizer.joblib"))
        event_vectors = np.load(os.path.join(MODELS_DIR, "event_vectors.npy"))
        events_df = pd.read_csv(os.path.join(DATASET_DIR, "events_mock.csv"))
        events_df.columns = events_df.columns.str.strip().str.lower()

        # --- Step 2: Create Profile Vector for the User ---
        profile_text = clean_text(user_interests) + " " + clean_text(user_department)
        user_vector = vectorizer.transform([profile_text])

        # --- Step 3: Compute Similarity ---
        similarity_scores = cosine_similarity(user_vector, event_vectors)[0]

        # --- Step 4: Get Top-N Recommendations ---
        # Ensure we don't recommend more events than available
        n_recommendations = min(TOP_N, len(events_df))
        top_indices = similarity_scores.argsort()[::-1][:n_recommendations]

        # Get event_ids and convert to standard Python int for JSON serialization
        recommended_event_ids = [int(eid) for eid in events_df.iloc[top_indices]['event_id'].tolist()]

        return recommended_event_ids

    except FileNotFoundError as e:
        # Handle cases where model files or datasets are missing
        print(json.dumps({"error": f"A required file was not found: {e.filename}. Please train the model first."}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        # Handle other potential errors
        print(json.dumps({"error": f"An unexpected error occurred: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    # This script expects two command-line arguments: interests and department
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python get_recommendations.py \"<user_interests>\" \"<user_department>\""}), file=sys.stderr)
        sys.exit(1)

    user_interests_arg = sys.argv[1]
    user_department_arg = sys.argv[2]

    # Get recommendations
    recommended_ids = get_recommendations(user_interests_arg, user_department_arg)

    # Print the result as a JSON string to stdout
    print(json.dumps(recommended_ids))
