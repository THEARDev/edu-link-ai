"""
Seed database with demo accounts + internships
Run: python seed.py
"""

import json

from app import create_app
from models import db, User, Internship
from auth import hash_password


DEMO_USERS = [
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


DEMO_INTERNSHIPS = [
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


def seed():
    print("Starting seed...")
    app = create_app()

    with app.app_context():
        db.create_all()
        print("Tables created")

        # ---------- USERS ----------
        for u in DEMO_USERS:
            existing = User.query.filter_by(email=u['email']).first()
            if existing:
                print(f"[SKIP] User {u['email']} already exists")
                continue

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
            print(f"[OK] Created user: {u['email']} ({u['role']})")

        db.session.commit()

        # ---------- INTERNSHIPS ----------
        existing_count = Internship.query.count()
        if existing_count == 0:
            company_user = User.query.filter_by(email='company@demo.com').first()

            if company_user:
                for data in DEMO_INTERNSHIPS:
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
                    print(f"[OK] Created internship: {data['title']}")

                db.session.commit()
            else:
                print("[WARN] Company user not found, skipping internships")
        else:
            print(f"[SKIP] {existing_count} internships already exist")

        print("\n[OK] Seeding complete!")
        print("\nDemo accounts:")
        print("  Student:  student@demo.com / demo123")
        print("  College:  college@demo.com / demo123")
        print("  Company:  company@demo.com / demo123")
        print(f"\nInternships: {Internship.query.count()}")


if __name__ == '__main__':
    seed()