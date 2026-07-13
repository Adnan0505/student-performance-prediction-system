import os
import shutil
from datetime import datetime
from flask import Flask, jsonify, request

from config import Config
from database import init_db, get_db

from routes.auth_routes import auth_bp
from routes.student_routes import student_bp
from routes.prediction_routes import prediction_bp
from routes.dashboard_routes import dashboard_bp
from routes.analytics_routes import analytics_bp
from routes.report_routes import report_bp
from routes.log_routes import log_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # --- Manual CORS handling (flask-cors is unavailable in this offline
    # sandbox; this achieves the same behaviour with zero dependencies) ---
    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = Config.CORS_ORIGINS
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        return response

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            return jsonify({"success": True}), 200

    init_db()

    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(prediction_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(log_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"success": True, "message": "SPPS API is running", "time": datetime.utcnow().isoformat()})

    @app.route("/api/backup", methods=["POST"])
    def backup_db():
        os.makedirs(os.path.join(os.path.dirname(Config.DATABASE_PATH), "backups"), exist_ok=True)
        stamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        dest = os.path.join(os.path.dirname(Config.DATABASE_PATH), "backups", f"spps_backup_{stamp}.db")
        shutil.copy(Config.DATABASE_PATH, dest)
        return jsonify({"success": True, "message": "Backup created", "file": dest})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "message": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"success": False, "message": "Internal server error"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
