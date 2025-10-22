Recommendation project mock data generator

This repository contains a small script to generate mock CSV files for a recommendation project.

Files created by the script (in `data/`):
- users.csv
- items.csv
- interactions.csv

Usage (PowerShell):

```powershell
# Generate default counts
python src/datageneration.py

# Generate custom counts
python src/datageneration.py --users 500 --items 1000 --interactions 5000
```

The script uses only the Python standard library. You can optionally create a virtual environment in `venv/` and use it.
