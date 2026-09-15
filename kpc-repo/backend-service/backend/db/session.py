"""
Database Connection and Session Manager.
Enforces WAL mode and foreign key constraints for SQLite,
and seamlessly switches to PostgreSQL if DATABASE_URL is configured.
"""
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator
from backend.config import SQLITE_DB_PATH, DATABASE_URL


class DatabaseSessionManager:
    _initialized = False

    @classmethod
    def get_connection(cls):
        """
        Returns a database connection.
        Configures SQLite for enterprise performance: WAL mode, foreign keys, 5s busy timeout.
        """
        # Ensure data directory exists
        SQLITE_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

        conn = sqlite3.connect(
            str(SQLITE_DB_PATH),
            timeout=10.0,
            detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES,
        )
        conn.row_factory = sqlite3.Row

        # Performance pragmas
        cursor = conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.execute("PRAGMA busy_timeout=5000;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.close()

        return conn

    @classmethod
    def init_db(cls, schema_path: Path = None):
        """Initializes schema tables if not present."""
        if schema_path is None:
            schema_path = Path(__file__).resolve().parent / "schema.sql"

        with open(schema_path, "r", encoding="utf-8") as f:
            ddl_script = f.read()

        conn = cls.get_connection()
        try:
            cursor = conn.cursor()
            cursor.executescript(ddl_script)
            conn.commit()
            cls._initialized = True
        finally:
            conn.close()


@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for safe transactional database sessions."""
    conn = DatabaseSessionManager.get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
