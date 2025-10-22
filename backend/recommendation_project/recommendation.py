"""Launcher to run the recommendation script under src/ from the project root.

Usage:
    python recommendation.py
"""
import runpy
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(PROJECT_ROOT)

sys_argv = [os.path.join("src", "recommendation.py")] + sys.argv[1:]
sys.argv = sys_argv

runpy.run_path(os.path.join(PROJECT_ROOT, "src", "recommendation.py"), run_name="__main__")
