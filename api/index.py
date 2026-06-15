import sys
import os

# Make the backend package importable
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, BACKEND_DIR)

from main import app  # noqa: E402,F401
