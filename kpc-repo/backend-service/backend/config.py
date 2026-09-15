"""
Core configuration module for the Demurrage & Detention Revenue Assurance Engine.
"""
import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Database Config: Support SQLite WAL out-of-the-box, with PostgreSQL fallback
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'demurrage_prod.db'}")
SQLITE_DB_PATH = DATA_DIR / "demurrage_prod.db"

# Engine Details
ENGINE_VERSION = "2.4.0"
ENGINE_NAME = "RevAssure-Demurrage-Detention-Engine"

# Enterprise Roles
ROLES = ["Ops", "Billing Approver", "Finance", "Auditor", "Admin", "OMC Representative"]
DEFAULT_ROLE = "Billing Approver"

# Auth
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-insecure-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_MINUTES = int(os.getenv("JWT_EXPIRY_MINUTES", "480"))  # 8-hour shift-length session

# Theme Colors (Dark Enterprise)
COLORS = {
    "background": "#0B1220",
    "panel": "#111B2E",
    "border": "#24324A",
    "primary": "#12B5A8",
    "secondary": "#1E5BA8",
    "warning": "#E0A030",
    "critical": "#D9534F",
    "text": "#E8EEF7",
    "muted": "#8D9AAF",
    "success": "#10B981",
}

# Currency
DEFAULT_CURRENCY = "KES"
DEFAULT_TAX_RATE = 0.05  # matches the per-contract tax_rate default in schema.sql
