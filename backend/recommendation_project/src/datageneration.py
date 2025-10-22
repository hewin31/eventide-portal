# src/datageneration_postgres.py

import random
import pandas as pd
from datetime import datetime, timedelta
import os

# ---------------- CONFIGURATION ----------------
random.seed(42)

N_STUDENTS = random.randint(500, 750)
N_EVENTS = 200
N_CLUBS = 10
INTERACTIONS_PER_STUDENT = (15, 40)

# Directories: make DATA_DIR absolute based on this file's location so outputs are deterministic
FILE_DIR = os.path.dirname(os.path.abspath(__file__))  # src/
PROJECT_ROOT = os.path.dirname(FILE_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
os.makedirs(DATA_DIR, exist_ok=True)

domains = ["Computer Science", "Information Technology", "Electronics", "Electrical", "Mechanical", "Civil"]
interests_list = ["AI","Machine Learning","Robotics","Cloud","Cybersecurity","IoT","Embedded Systems",
                  "CAD","3D Printing","Automation","Sustainability","Power Systems","Networking","Web Development"]
skills_list = ["Python","C++","Java","React","MATLAB","Arduino","TensorFlow","AWS","Linux",
               "AutoCAD","SolidWorks","Revit","PCB Design","Proteus","Wireshark"]
event_types = ["Workshop","Seminar","Hackathon","Competition","Exhibition"]
locations = ["Auditorium","CSE Hall","ECE Lab","Mechanical Block","Civil Seminar Hall","Main Hall"]
actions = ["viewed","liked","registered","attended"]
action_weights = {"viewed":0.2,"liked":0.5,"registered":0.8,"attended":1.0}

# ---------------- GENERATE STUDENTS ----------------
students = []
for i in range(1, N_STUDENTS + 1):
    domain = random.choice(domains)
    interests = ", ".join(random.sample(interests_list, random.randint(2, 4)))
    skills = ", ".join(random.sample(skills_list, random.randint(2, 4)))
    year = random.randint(1, 4)
    activity = round(random.uniform(0.5, 1.0), 2)
    students.append([i, f"Student_{i}", f"student{i}@engg.edu", domain, interests, skills, year, "", activity])

students_df = pd.DataFrame(students, columns=[
    "student_id","name","email","domain","interests","skills","year_of_study","attended_events","activity_score"
])

# ---------------- GENERATE CLUBS ----------------
clubs = []
for i in range(1, N_CLUBS + 1):
    domain = random.choice(domains)
    # followers will be filled after student generation
    pop_score = round(random.uniform(0.5, 1.0), 2)
    clubs.append([i,f"Club_{i}",domain,"",pop_score])

clubs_df = pd.DataFrame(clubs, columns=["club_id","club_name","domain","followers","popularity_score"])

# ---------------- GENERATE EVENTS ----------------
events = []
for i in range(1, N_EVENTS + 1):
    domain = random.choice(domains)
    tags = ", ".join(random.sample(interests_list, random.randint(2, 4)))
    club_id = random.randint(1, N_CLUBS)
    title = f"{random.choice(interests_list)} {random.choice(['Workshop','Summit','Expo','Challenge','Hackathon'])}"
    desc = f"An engaging event focused on {tags} organized by Club_{club_id}."
    date = datetime(2025,10,1) + timedelta(days=random.randint(0,90))
    pop_score = round(random.uniform(0.5, 1.0), 2)
    total_reg = random.randint(20,300)
    created = datetime(2025,8,1) + timedelta(days=random.randint(0,60))
    events.append([i,title,desc,domain,tags,club_id,random.choice(event_types),date.strftime("%Y-%m-%d"),
                   random.choice(locations),pop_score,total_reg,created.strftime("%Y-%m-%d %H:%M:%S")])

events_df = pd.DataFrame(events, columns=[
    "event_id","title","description","domain","tags","club_id","event_type","date",
    "location","popularity_score","total_registered","created_at"
])

# ---------------- GENERATE INTERACTIONS ----------------
interactions = []
interaction_id = 1
student_attended = {s: [] for s in students_df["student_id"]}  # to populate attended_events

for s in students_df["student_id"]:
    n_interactions = random.randint(*INTERACTIONS_PER_STUDENT)
    event_ids = random.sample(range(1, N_EVENTS + 1), n_interactions)
    for e in event_ids:
        action = random.choices(actions, weights=[0.5,0.2,0.2,0.1])[0]
        timestamp = datetime(2025,8,1) + timedelta(days=random.randint(0,75))
        rating = round(random.uniform(3.0,5.0),1) if action in ["registered","attended"] else 0
        weight = action_weights[action]
        interactions.append([interaction_id,s,e,action,timestamp.strftime("%Y-%m-%d %H:%M:%S"),rating,weight])
        if action=="attended":
            student_attended[s].append(str(e))
        interaction_id += 1

interactions_df = pd.DataFrame(interactions, columns=[
    "interaction_id","student_id","event_id","action_type","timestamp","rating","weight"
])

# ---------------- UPDATE attended_events in students ----------------
students_df["attended_events"] = students_df["student_id"].map(lambda x: ",".join(student_attended[x]))

# ---------------- UPDATE followers in clubs ----------------
for idx, row in clubs_df.iterrows():
    followers_count = random.randint(30, 150)
    followers_ids = random.sample(list(students_df["student_id"]), followers_count)
    clubs_df.at[idx, "followers"] = ",".join(map(str, followers_ids))

# ---------------- SAVE CSV FILES ----------------
students_df.to_csv(os.path.join(DATA_DIR, "students_mock.csv"), index=False)
clubs_df.to_csv(os.path.join(DATA_DIR, "clubs_mock.csv"), index=False)
events_df.to_csv(os.path.join(DATA_DIR, "events_mock.csv"), index=False)
interactions_df.to_csv(os.path.join(DATA_DIR, "interactions_mock.csv"), index=False)

print(f"Mock dataset generated successfully with {N_STUDENTS} students in {DATA_DIR}!")
