"""Launcher to run the src/datageneration.py generator from the project root.

This script changes CWD to the project root, then runs the generator module so relative paths in
`src/datageneration.py` (like ../data) still resolve correctly.

Usage:
    python datagenerate.py --help
"""
import runpy
import os
import sys

# Ensure project root is the directory containing this file
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(PROJECT_ROOT)

# If user passed arguments, forward them to the module via sys.argv
# Keep program name as 'datageneration.py' when running the module
sys_argv = [os.path.join("src", "datageneration.py")] + sys.argv[1:]
sys.argv = sys_argv

# Run the src script as __main__
runpy.run_path(os.path.join(PROJECT_ROOT, "src", "datageneration.py"), run_name="__main__")
