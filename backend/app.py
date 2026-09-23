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
    
    # Auto-seed if database is empty
    from models import User, Internship
    import json
    
    if User.query.count() == 0:
        print("[INFO] Empty database detected, seeding...")
        
        # Import seed function
        from auth import hash_password
        
        demo_users = [
            {
                'name': 'Aarav Sharma',
                'email': 'student@demo.com',
                'password': 'demo123',
                'role': 'student',
                'college_name': 'IIT Delhi',
                'branch': 'CSE',
                'year': '3',
                'cgpa': '8.7'
            },
            {
                'name': 'IIT Delhi',
                'email': 'college@demo.com',
                'password': 'demo123',
                'role': 'college',
                'college_name': 'IIT Delhi'
            },
            {
                'name': 'TechCorp India',
                'email': 'company@demo.com',
                'password': 'demo123',
                'role': 'company',
                'company_name': 'TechCorp India'
            }
        ]
        
        for u in demo_users:
            user = User(
                name=u['name'],
                email=u['email'],
                password_hash=hash_password(u['password']),
                role=u['role'],
                college_name=u.get('college_name'),
                company_name=u.get('company_name'),
                branch=u.get('branch'),
                year=u.get('year'),
                cgpa=u.get('cgpa')
            )
            db.session.add(user)
        
        db.session.commit()
        print("[OK] Users seeded")
        
        # Seed internships
        company_user = User.query.filter_by(email='company@demo.com').first()
        
        if company_user:
            demo_internships = [
                {
                    'title': 'Full Stack Developer Intern',
                    'description': 'Work on modern web applications using React, Node.js, and cloud services.',
                    'location': 'Bangalore',
                    'type': 'fullstack',
                    'duration': '6 months',
                    'stipend': 'Rs. 25,000/mo',
                    'skills_required': ['JavaScript', 'React', 'Node.js', 'SQL', 'MongoDB', 'Git', 'Docker', 'REST APIs']
                },
                {
                    'title': 'Frontend Developer Intern',
                    'description': 'Build beautiful and responsive user interfaces with React and TypeScript.',
                    'location': 'Remote',
                    'type': 'frontend',
                    'duration': '3 months',
                    'stipend': 'Rs. 18,000/mo',
                    'skills_required': ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Git', 'Figma']
                },
                {
                    'title': 'Backend Developer Intern',
                    'description': 'Design and build scalable backend services and APIs.',
                    'location': 'Mumbai',
                    'type': 'backend',
                    'duration': '6 months',
                    'stipend': 'Rs. 22,000/mo',
                    'skills_required': ['Node.js', 'Python', 'SQL', 'MongoDB', 'REST APIs', 'Docker', 'AWS']
                },
                {
                    'title': 'Data Science Intern',
                    'description': 'Work on ML models and data pipelines for real-world problems.',
                    'location': 'Hyderabad',
                    'type': 'datascientist',
                    'duration': '6 months',
                    'stipend': 'Rs. 30,000/mo',
                    'skills_required': ['Python', 'SQL', 'Machine Learning', 'Pandas', 'NumPy', 'TensorFlow']
                },
                {
                    'title': 'Machine Learning Engineer Intern',
                    'description': 'Deploy ML models and build MLOps pipelines.',
                    'location': 'Remote',
                    'type': 'ml',
                    'duration': '6 months',
                    'stipend': 'Rs. 35,000/mo',
                    'skills_required': ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Docker']
                }
            ]
            
            for data in demo_internships:
                internship = Internship(
                    company_id=company_user.id,
                    title=data['title'],
                    description=data['description'],
                    location=data['location'],
                    type=data['type'],
                    duration=data['duration'],
                    stipend=data['stipend'],
                    skills_required=json.dumps(data['skills_required']),
                    openings=1,
                    status='active'
                )
                db.session.add(internship)
            
            db.session.commit()
            print("[OK] Internships seeded")


if __name__ == '__main__':
    print("[OK] Edu-Link AI backend starting...")
    print("[OK] URL: http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=True)