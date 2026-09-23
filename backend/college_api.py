"""
College APIs — Stats, Students, Analytics
"""

from flask import Blueprint, jsonify

from models import db, User, Skill, Application, Internship
from auth import token_required

college_bp = Blueprint('college', __name__)


@college_bp.route('/stats', methods=['GET'])
@token_required
def get_stats(current_user):
    """Get college stats with real data"""
    if current_user.role != 'college':
        return jsonify({'error': 'Access denied'}), 403

    # Total students
    total_students = User.query.filter_by(role='student').count()

    # Students with skills (active)
    all_students = User.query.filter_by(role='student').all()
    students_with_skills = sum(
        1 for s in all_students
        if Skill.query.filter_by(user_id=s.id).count() > 0
    )

    # Placed / Interned (students with at least 1 application)
    placed_count = 0
    total_readiness = 0
    students_with_readiness = 0

    for student in all_students:
        apps = Application.query.filter_by(student_id=student.id).count()
        if apps > 0:
            placed_count += 1

        # Calculate readiness
        skills = Skill.query.filter_by(user_id=student.id).all()
        skills_score = min(len(skills) * 5, 100)

        # Profile completeness
        profile_fields = sum([
            bool(student.name),
            bool(student.email),
            bool(student.phone),
            bool(student.college_name),
            bool(student.branch),
            bool(student.year),
            bool(student.cgpa)
        ])
        profile_score = round((profile_fields / 7) * 100)

        readiness = round((skills_score * 0.6) + (profile_score * 0.4))
        total_readiness += readiness
        students_with_readiness += 1

    avg_readiness = round(total_readiness / students_with_readiness) if students_with_readiness > 0 else 0

    # Active internships
    active_internships = Internship.query.filter_by(status='active').count()

    return jsonify({
        'stats': {
            'totalStudents': total_students,
            'activeStudents': students_with_skills,
            'placed': placed_count,
            'avgReadiness': avg_readiness,
            'activeInternships': active_internships
        }
    }), 200


@college_bp.route('/students', methods=['GET'])
@token_required
def get_students(current_user):
    """Get list of students with their skills + readiness"""
    if current_user.role != 'college':
        return jsonify({'error': 'Access denied'}), 403

    students = User.query.filter_by(role='student').all()

    result = []
    for s in students:
        skills = Skill.query.filter_by(user_id=s.id).all()

        # Calculate readiness
        skills_score = min(len(skills) * 5, 100)
        profile_fields = sum([
            bool(s.name), bool(s.email), bool(s.phone),
            bool(s.college_name), bool(s.branch), bool(s.year), bool(s.cgpa)
        ])
        profile_score = round((profile_fields / 7) * 100)
        readiness = round((skills_score * 0.6) + (profile_score * 0.4))

        # Application status
        apps = Application.query.filter_by(student_id=s.id).count()
        status = 'Interned' if apps > 0 else 'Searching'

        result.append({
            **s.to_dict(),
            'skills': [sk.to_dict() for sk in skills],
            'readiness': readiness,
            'applications': apps,
            'status': status
        })

    # Sort by readiness (highest first)
    result.sort(key=lambda x: x['readiness'], reverse=True)

    return jsonify({'students': result}), 200


@college_bp.route('/analytics', methods=['GET'])
@token_required
def get_analytics(current_user):
    """Get college analytics — skill heatmap, top skills"""
    if current_user.role != 'college':
        return jsonify({'error': 'Access denied'}), 403

    students = User.query.filter_by(role='student').all()

    # Branch-wise skill count
    branches = {}
    all_skills = {}

    for s in students:
        branch = s.branch or 'other'
        if branch not in branches:
            branches[branch] = {'students': 0, 'skills': {}}

        branches[branch]['students'] += 1

        skills = Skill.query.filter_by(user_id=s.id).all()
        for skill in skills:
            # Branch-wise
            branches[branch]['skills'][skill.name] = branches[branch]['skills'].get(skill.name, 0) + 1
            # Overall
            all_skills[skill.name] = all_skills.get(skill.name, 0) + 1

    # Top skills (sorted)
    top_skills = sorted(all_skills.items(), key=lambda x: x[1], reverse=True)[:10]

    return jsonify({
        'branches': branches,
        'topSkills': [{'name': k, 'count': v} for k, v in top_skills],
        'totalStudents': len(students)
    }), 200