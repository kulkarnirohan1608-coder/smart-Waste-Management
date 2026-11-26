from flask import Flask, jsonify, request
from flask_cors import CORS
from database import get_connection, init_db

app = Flask(__name__)
CORS(app)
init_db()

def row_dict(row):
    return dict(row) if row else None

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Smart Waste Management API is running"})

@app.get("/api/dashboard")
def dashboard():
    with get_connection() as conn:
        bins = conn.execute("SELECT * FROM bins ORDER BY id").fetchall()
        collections = conn.execute("SELECT * FROM collections ORDER BY id DESC").fetchall()
        records = conn.execute("SELECT category, SUM(weight_kg) AS total FROM waste_records GROUP BY category").fetchall()
        total_bins = len(bins)
        full_bins = sum(1 for b in bins if b["fill_level"] >= 80)
        pending = sum(1 for c in collections if c["status"] != "Completed")
        total_waste = conn.execute("SELECT COALESCE(SUM(weight_kg), 0) FROM waste_records").fetchone()[0]
        return jsonify({
            "total_bins": total_bins,
            "full_bins": full_bins,
            "pending_collections": pending,
            "total_waste_kg": round(total_waste, 1),
            "bins": [row_dict(b) for b in bins],
            "waste_by_category": [row_dict(r) for r in records],
        })

@app.get("/api/bins")
def get_bins():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM bins ORDER BY id").fetchall()
        return jsonify([row_dict(r) for r in rows])

@app.post("/api/bins")
def add_bin():
    data = request.get_json(silent=True) or {}
    name, location = data.get("name", "").strip(), data.get("location", "").strip()
    if not name or not location:
        return jsonify({"error": "Bin name and location are required"}), 400
    fill = max(0, min(100, int(data.get("fill_level", 0))))
    waste_type = data.get("waste_type", "Mixed")
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO bins(name, location, fill_level, waste_type, last_updated) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
            (name, location, fill, waste_type),
        )
        new_id = cur.lastrowid
        row = conn.execute("SELECT * FROM bins WHERE id=?", (new_id,)).fetchone()
        return jsonify(row_dict(row)), 201

@app.put("/api/bins/<int:bin_id>")
def update_bin(bin_id):
    data = request.get_json(silent=True) or {}
    with get_connection() as conn:
        existing = conn.execute("SELECT * FROM bins WHERE id=?", (bin_id,)).fetchone()
        if not existing:
            return jsonify({"error": "Bin not found"}), 404
        name = data.get("name", existing["name"])
        location = data.get("location", existing["location"])
        fill = max(0, min(100, int(data.get("fill_level", existing["fill_level"]))))
        waste_type = data.get("waste_type", existing["waste_type"])
        conn.execute(
            "UPDATE bins SET name=?, location=?, fill_level=?, waste_type=?, last_updated=CURRENT_TIMESTAMP WHERE id=?",
            (name, location, fill, waste_type, bin_id),
        )
        return jsonify(row_dict(conn.execute("SELECT * FROM bins WHERE id=?", (bin_id,)).fetchone()))

@app.delete("/api/bins/<int:bin_id>")
def delete_bin(bin_id):
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM bins WHERE id=?", (bin_id,))
        if cur.rowcount == 0:
            return jsonify({"error": "Bin not found"}), 404
        return jsonify({"message": "Bin deleted"})

@app.get("/api/collections")
def get_collections():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM collections ORDER BY id DESC").fetchall()
        return jsonify([row_dict(r) for r in rows])

@app.post("/api/collections")
def add_collection():
    data = request.get_json(silent=True) or {}
    bin_id = data.get("bin_id")
    if not bin_id:
        return jsonify({"error": "Select a dustbin"}), 400
    with get_connection() as conn:
        bin_row = conn.execute("SELECT * FROM bins WHERE id=?", (bin_id,)).fetchone()
        if not bin_row:
            return jsonify({"error": "Bin not found"}), 404
        date = data.get("scheduled_date", "")
        if not date:
            return jsonify({"error": "Scheduled date is required"}), 400
        cur = conn.execute(
            "INSERT INTO collections(bin_id, bin_name, location, scheduled_date, status) VALUES (?, ?, ?, ?, 'Pending')",
            (bin_id, bin_row["name"], bin_row["location"], date),
        )
        return jsonify(row_dict(conn.execute("SELECT * FROM collections WHERE id=?", (cur.lastrowid,)).fetchone())), 201

@app.patch("/api/collections/<int:collection_id>")
def update_collection(collection_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ["Pending", "In Progress", "Completed"]:
        return jsonify({"error": "Invalid collection status"}), 400
    with get_connection() as conn:
        cur = conn.execute("UPDATE collections SET status=? WHERE id=?", (status, collection_id))
        if cur.rowcount == 0:
            return jsonify({"error": "Collection not found"}), 404
        return jsonify(row_dict(conn.execute("SELECT * FROM collections WHERE id=?", (collection_id,)).fetchone()))

@app.get("/api/waste-records")
def waste_records():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM waste_records ORDER BY recorded_date DESC, id DESC").fetchall()
        return jsonify([row_dict(r) for r in rows])

@app.get("/api/alerts")
def alerts():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM bins WHERE fill_level >= 80 ORDER BY fill_level DESC").fetchall()
        return jsonify([
            {"id": r["id"], "bin_name": r["name"], "location": r["location"],
             "fill_level": r["fill_level"], "severity": "Critical" if r["fill_level"] >= 95 else "Warning"}
            for r in rows
        ])

@app.errorhandler(404)
def not_found(_):
    return jsonify({"error": "Endpoint not found"}), 404

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
