"""
Company APIs — Internships, Candidates
"""

import json
from flask import Blueprint, request, jsonify

from models import db, User, Internship, Skill, Application
from auth import token_required

company_bp = Blueprint('company', __name__)


# ---------- HELPERS ----------

def calculate_match_score(student_skills, required_skills):
    """Calculate match score"""
    if not required_skills:
        return 0
    student_lower = [s.lower() for s in student_skills]
    matched = sum(1 for r in required_skills if r.lower() in student_lower)
    return round((matched / len(required_skills)) * 100)


# ---------- INTERNSHIPS ----------

@company_bp.route('/internships', methods=['GET'])
@token_required
def get_internships(current_user):
    """Get company's internships"""
    if current_user.role != 'company':
        return jsonify({'error': 'Access denied'}), 403

    internships = Internship.query.filter_by(company_id=current_user.id).all()

    result = []
    for i in internships:
        # Count applications
        apps = Application.query.filter_by(internship_id=i.id).all()
        i_dict = i.to_dict()
        i_dict['applications'] = len(apps)
        result.append(i_dict)

    return jsonify({'internships': result}), 200


@company_bp.route('/internships', methods=['POST'])
@token_required
def create_internship(current_user):
    """Create new internship"""
    if current_user.role != 'company':
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    title = data.get('title', '').strip()

    if not title:
        return jsonify({'error': 'Title required'}), 400

    skills = data.get('skills_required', [])
    if isinstance(skills, list):
        skills_json = json.dumps(skills)
    else:
        skills_json = json.dumps([])

    internship = Internship(
        company_id=current_user.id,
        title=title,
        description=data.get('description', ''),
        location=data.get('location', ''),
        type=data.get('type', ''),
        duration=data.get('duration', ''),
        stipend=data.get('stipend', ''),
        openings=int(data.get('openings', 1)),
        skills_required=skills_json,
        status='active'
    )

    db.session.add(internship)
    db.session.commit()

    return jsonify({
        'message': 'Internship posted successfully',
        'internship': internship.to_dict()
    }), 201


# ---------- CANDIDATES ----------

@company_bp.route('/candidates', methods=['GET'])
@token_required
def get_candidates(current_user):
    """Get candidates (students) with match scores"""
    if current_user.role != 'company':
        return jsonify({'error': 'Access denied'}), 403

    # Get all required skills from company's internships
    company_internships = Internship.query.filter_by(company_id=current_user.id).all()

    all_required_skills = set()
    for i in company_internships:
        try:
            skills = json.loads(i.skills_required) if i.skills_required else []
            all_required_skills.update(skills)
        except:
            pass

    all_required_skills = list(all_required_skills)

    # Get all students
    students = User.query.filter_by(role='student').all()

    result = []
    for s in students:
        skills = Skill.query.filter_by(user_id=s.id).all()
        student_skill_names = [sk.name for sk in skills]

        # Calculate match score
        match_score = calculate_match_score(student_skill_names, all_required_skills)

        # Application status
        apps = Application.query.filter_by(student_id=s.id).all()
        status = 'new'
        if apps:
            latest_app = apps[-1]
            status = latest_app.status

        result.append({
            **s.to_dict(),
            'skills': [sk.to_dict() for sk in skills],
            'match_score': match_score,
            'status': status,
            'applications': len(apps)
        })

    # Sort by match score
    result.sort(key=lambda x: x['match_score'], reverse=True)

    return jsonify({'candidates': result}), 200


@company_bp.route('/candidates/<int:student_id>/shortlist', methods=['POST'])
@token_required
def shortlist_candidate(current_user, student_id):
    """Shortlist a candidate"""
    if current_user.role != 'company':
        return jsonify({'error': 'Access denied'}), 403

    student = db.session.get(User, student_id)
    if not student or student.role != 'student':
        return jsonify({'error': 'Student not found'}), 404

    # Find or create application
    app = Application.query.filter_by(student_id=student_id).first()

    if not app:
        # Get first internship of this company
        internship = Internship.query.filter_by(company_id=current_user.id).first()
        if not internship:
            return jsonify({'error': 'Post an internship first'}), 400

        app = Application(
            student_id=student_id,
            internship_id=internship.id,
            status='shortlisted'
        )
        db.session.add(app)
    else:
        app.status = 'shortlisted'

    db.session.commit()

    return jsonify({'message': 'Candidate shortlisted'}), 200


@company_bp.route('/candidates/<int:student_id>/hire', methods=['POST'])
@token_required
def hire_candidate(current_user, student_id):
    """Hire a candidate"""
    if current_user.role != 'company':
        return jsonify({'error': 'Access denied'}), 403

    student = db.session.get(User, student_id)
    if not student or student.role != 'student':
        return jsonify({'error': 'Student not found'}), 404

    app = Application.query.filter_by(student_id=student_id).first()

    if not app:
        internship = Internship.query.filter_by(company_id=current_user.id).first()
        if not internship:
            return jsonify({'error': 'Post an internship first'}), 400

        app = Application(
            student_id=student_id,
            internship_id=internship.id,
            status='hired'
        )
        db.session.add(app)
    else:
        app.status = 'hired'

    db.session.commit()

    return jsonify({'message': 'Candidate hired'}), 200


# ---------- STATS ----------

@company_bp.route('/stats', methods=['GET'])
@token_required
def get_stats(current_user):
    """Get company stats"""
    if current_user.role != 'company':
        return jsonify({'error': 'Access denied'}), 403

    internships = Internship.query.filter_by(company_id=current_user.id).all()
    internship_ids = [i.id for i in internships]

    total_applications = 0
    shortlisted = 0
    hired = 0

    if internship_ids:
        total_applications = Application.query.filter(
            Application.internship_id.in_(internship_ids)
        ).count()

        shortlisted = Application.query.filter(
            Application.internship_id.in_(internship_ids),
            Application.status == 'shortlisted'
        ).count()

        hired = Application.query.filter(
            Application.internship_id.in_(internship_ids),
            Application.status == 'hired'
        ).count()

    # Top candidates
    students = User.query.filter_by(role='student').count()

    return jsonify({
        'stats': {
            'activeInternships': len([i for i in internships if i.status == 'active']),
            'totalApplications': total_applications,
            'shortlisted': shortlisted,
            'hired': hired,
            'totalStudents': students
        }
    }), 200