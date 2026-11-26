import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).with_name("waste_management.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    with get_connection() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS bins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            fill_level INTEGER NOT NULL DEFAULT 0,
            waste_type TEXT NOT NULL DEFAULT 'Mixed',
            last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bin_id INTEGER,
            bin_name TEXT NOT NULL,
            location TEXT NOT NULL,
            scheduled_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending',
            FOREIGN KEY(bin_id) REFERENCES bins(id) ON DELETE SET NULL
        );
        CREATE TABLE IF NOT EXISTS waste_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            weight_kg REAL NOT NULL,
            recorded_date TEXT NOT NULL DEFAULT CURRENT_DATE
        );
        """)
        count = conn.execute("SELECT COUNT(*) FROM bins").fetchone()[0]
        if count == 0:
            conn.executemany(
                "INSERT INTO bins(name, location, fill_level, waste_type) VALUES (?, ?, ?, ?)",
                [
                    ("Bin 01", "College Main Gate", 92, "Mixed"),
                    ("Bin 02", "Library Block", 46, "Dry"),
                    ("Bin 03", "Cafeteria", 81, "Wet"),
                    ("Bin 04", "Engineering Block", 28, "Mixed"),
                    ("Bin 05", "Parking Area", 67, "Dry"),
                    ("Bin 06", "Garden", 15, "Wet"),
                ],
            )
            conn.executemany(
                "INSERT INTO collections(bin_id, bin_name, location, scheduled_date, status) VALUES (?, ?, ?, ?, ?)",
                [
                    (1, "Bin 01", "College Main Gate", "2026-11-25", "Pending"),
                    (3, "Bin 03", "Cafeteria", "2026-11-25", "In Progress"),
                    (5, "Bin 05", "Parking Area", "2026-11-26", "Pending"),
                ],
            )
            conn.executemany(
                "INSERT INTO waste_records(category, weight_kg, recorded_date) VALUES (?, ?, ?)",
                [
                    ("Organic", 42.5, "2026-11-21"),
                    ("Plastic", 28.0, "2026-11-21"),
                    ("Paper", 19.5, "2026-11-22"),
                    ("Metal", 8.0, "2026-11-22"),
                    ("Organic", 35.0, "2026-11-23"),
                    ("Plastic", 21.0, "2026-11-24"),
                ],
            )
