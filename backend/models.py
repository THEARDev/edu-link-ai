"""
Database Models
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    """User model — Student / College / Company"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)

    phone = db.Column(db.String(20), nullable=True)
    college_name = db.Column(db.String(200), nullable=True)
    company_name = db.Column(db.String(200), nullable=True)
    branch = db.Column(db.String(50), nullable=True)
    year = db.Column(db.String(10), nullable=True)
    cgpa = db.Column(db.String(10), nullable=True)
    bio = db.Column(db.String(500), nullable=True)

    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'phone': self.phone,
            'college_name': self.college_name,
            'company_name': self.company_name,
            'branch': self.branch,
            'year': self.year,
            'cgpa': self.cgpa,
            'bio': self.bio,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<User {self.email} ({self.role})>'


class Skill(db.Model):
    """Student Skills — Career Twin"""
    __tablename__ = 'skills'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(20), default='intermediate')
    source = db.Column(db.String(20), default='manual')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'level': self.level,
            'source': self.source
        }


class Internship(db.Model):
    """Internships posted by companies"""
    __tablename__ = 'internships'

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(100), nullable=True)
    type = db.Column(db.String(50), nullable=True)
    duration = db.Column(db.String(50), nullable=True)
    stipend = db.Column(db.String(50), nullable=True)
    openings = db.Column(db.Integer, default=1)
    skills_required = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'location': self.location,
            'type': self.type,
            'duration': self.duration,
            'stipend': self.stipend,
            'openings': self.openings,
            'skills_required': json.loads(self.skills_required) if self.skills_required else [],
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Application(db.Model):
    """Student applications to internships"""
    __tablename__ = 'applications'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    internship_id = db.Column(db.Integer, db.ForeignKey('internships.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    match_score = db.Column(db.Integer, default=0)
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'internship_id': self.internship_id,
            'status': self.status,
            'match_score': self.match_score,
            'applied_at': self.applied_at.isoformat() if self.applied_at else None
        }