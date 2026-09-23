"""
Student APIs — Profile, Skills
"""

from flask import Blueprint, request, jsonify

from models import db, User, Skill
from auth import token_required

student_bp = Blueprint('student', __name__)


# ---------- PROFILE ----------

@student_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    if current_user.role != 'student':
        return jsonify({'error': 'Access denied'}), 403
    return jsonify({'user': current_user.to_dict()}), 200


@student_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    if current_user.role != 'student':
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()

    if 'name' in data:
        current_user.name = data['name']
    if 'phone' in data:
        current_user.phone = data['phone']
    if 'college_name' in data:
        current_user.college_name = data['college_name']
    if 'branch' in data:
        current_user.branch = data['branch']
    if 'year' in data:
        current_user.year = data['year']
    if 'cgpa' in data:
        current_user.cgpa = data['cgpa']
    if 'bio' in data:
        current_user.bio = data['bio']

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': current_user.to_dict()}), 200


# ---------- SKILLS ----------

@student_bp.route('/skills', methods=['GET'])
@token_required
def get_skills(current_user):
    if current_user.role != 'student':
        return jsonify({'error': 'Access denied'}), 403

    skills = Skill.query.filter_by(user_id=current_user.id).all()
    return jsonify({'skills': [s.to_dict() for s in skills]}), 200


@student_bp.route('/skills', methods=['POST'])
@token_required
def add_skill(current_user):
    if current_user.role != 'student':
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    name = data.get('name', '').strip()
    level = data.get('level', 'intermediate')
    source = data.get('source', 'manual')

    if not name:
        return jsonify({'error': 'Skill name required'}), 400

    existing = Skill.query.filter_by(user_id=current_user.id, name=name).first()
    if existing:
        return jsonify({'error': 'Skill already exists'}), 400

    skill = Skill(user_id=current_user.id, name=name, level=level, source=source)
    db.session.add(skill)
    db.session.commit()

    return jsonify({'message': 'Skill added', 'skill': skill.to_dict()}), 201


@student_bp.route('/skills/<int:skill_id>', methods=['DELETE'])
@token_required
def delete_skill(current_user, skill_id):
    if current_user.role != 'student':
        return jsonify({'error': 'Access denied'}), 403

    skill = Skill.query.filter_by(id=skill_id, user_id=current_user.id).first()
    if not skill:
        return jsonify({'error': 'Skill not found'}), 404

    db.session.delete(skill)
    db.session.commit()
    return jsonify({'message': 'Skill deleted'}), 200


# ---------- DASHBOARD ----------

@student_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    if current_user.role != 'student':
        return jsonify({'error': 'Access denied'}), 403

    skills = Skill.query.filter_by(user_id=current_user.id).all()

    return jsonify({
        'stats': {
            'totalSkills': len(skills),
            'internshipMatches': 0,
            'readinessScore': 0,
            'applications': 0
        },
        'skills': [s.to_dict() for s in skills]
    }), 200