"""
Edu-Link AI — Flask Backend
Main Application Entry Point
"""

from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from models import db
from auth import auth_bp
from student_api import student_bp
from college_api import college_bp
from company_api import company_bp
from resume_api import resume_bp
from internship_api import internship_bp


def create_app():
    """Application factory"""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize database
    db.init_app(app)

    # CORS
    CORS(
        app,
        origins=app.config['CORS_ORIGINS'],
        supports_credentials=True,
        allow_headers=['Content-Type', 'Authorization'],
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    )

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(student_bp, url_prefix='/api/student')
    app.register_blueprint(college_bp, url_prefix='/api/college')
    app.register_blueprint(company_bp, url_prefix='/api/company')
    app.register_blueprint(resume_bp, url_prefix='/api/resume')
    app.register_blueprint(internship_bp, url_prefix='/api/internship')

    # ---------- ROOT ROUTES ----------
    @app.route('/')
    def root():
        return jsonify({
            'app': 'Edu-Link AI',
            'status': 'running',
            'version': '1.0.0'
        })

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'healthy'})

    # ---------- ERROR HANDLERS ----------
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    return app


# Create app instance for gunicorn
app = create_app()

with app.app_context():
    db.create_all()


if __name__ == '__main__':
    print("[OK] Edu-Link AI backend starting...")
    print("[OK] URL: http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=True)