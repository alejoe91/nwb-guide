from pathlib import Path
import json
import os
import sys


def resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller"""
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = Path(__file__).parent.parent.parent.parent

    return Path(base_path) / relative_path


path_config = resource_path(
    "paths.config.json"
)  # NOTE: Must have pyflask for running the GUIDE as a whole, but errors for just the server
f = path_config.open()
data = json.load(f)
GUIDE_ROOT_FOLDER = Path(Path.home(), data["root"])
STUB_SAVE_FOLDER_PATH = Path(GUIDE_ROOT_FOLDER, *data["subfolders"]["stubs"])
CONVERSION_SAVE_FOLDER_PATH = Path(GUIDE_ROOT_FOLDER, *data["subfolders"]["conversions"])
TUTORIAL_SAVE_FOLDER_PATH = Path(GUIDE_ROOT_FOLDER, *data["subfolders"]["tutorial"])

f.close()
