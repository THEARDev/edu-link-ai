"""
Internship APIs — Matching, Explanation, Apply
"""

from flask import Blueprint, request, jsonify

from models import db, User, Skill, Internship, Application
from auth import token_required

internship_bp = Blueprint('internship', __name__)


# ---------- HELPERS ----------

def calculate_match(student_skill_names, required_skills):
    """
    Calculate match score with detailed breakdown.
    Returns: {score, matched, missing, total}
    """
    if not required_skills:
        return {
            'score': 0,
            'matched': [],
            'missing': [],
            'total': 0
        }

    student_lower = [s.lower() for s in student_skill_names]
    required_lower = [s.lower() for s in required_skills]

    matched = []
    missing = []

    for i, skill in enumerate(required_skills):
        if required_lower[i] in student_lower:
            matched.append(skill)
        else:
            missing.append(skill)

    score = round((len(matched) / len(required_skills)) * 100)

    return {
        'score': score,
        'matched': matched,
        'missing': missing,
        'total': len(required_skills)
    }


# ---------- ROUTES ----------

@internship_bp.route('/matches', methods=['GET'])
@token_required
def get_matches(current_user):
    """Get internship matches for student"""
    if current_user.role != 'student':
        return jsonify({'error': 'Access denied'}), 403

    # Get student skills
    skills = Skill.query.filter_by(user_id=current_user.id).all()
    student_skill_names = [s.name for s in skills]

    # Get all active internships
    internships = Internship.query.filter_by(status='active').all()

    # Get applied internship IDs
    applications = Application.query.filter_by(student_id=current_user.id).all()
    applied_ids = [a.internship_id for a in applications]

    result = []
    for internship in internships:
        # Parse required skills
        import json
        try:
            required = json.loads(internship.skills_required) if internship.skills_required else []
        except:
            required = []

        # Calculate match
        match_data = calculate_match(student_skill_names, required)

        # Get company name
        company = db.session.get(User, internship.company_id)
        company_name = company.company_name or company.name if company else 'Unknown'

        result.append({
            'id': internship.id,
            'title': internship.title,
            'company': company_name,
            'description': internship.description,
            'location': internship.location,
            'duration': internship.duration,
            'stipend': internship.stipend,
            'type': internship.type,
            'required_skills': required,
            'match_score': match_data['score'],
            'matched_skills': match_data['matched'],
            'missing_skills': match_data['missing'],
            'total_required': match_data['total'],
            'is_applied': internship.id in applied_ids
        })

    # Sort by match score (highest first)
    result.sort(key=lambda x: x['match_score'], reverse=True)

    return jsonify({
        'internships': result,
        'total': len(result)
    }), 200


@internship_bp.route('/<int:internship_id>/explain', methods=['GET'])
@token_required
def explain_match(current_user, internship_id):
    """Get detailed explanation of why this internship matches"""
    if current_user.role != 'student':
        return jsonify({'error': 'Access denied'}), 403

    internship = db.session.get(Internship, internship_id)
    if not internship:
        return jsonify({'error': 'Internship not found'}), 404

    # Get student skills
    skills = Skill.query.filter_by(user_id=current_user.id).all()
    student_skill_names = [s.name for s in skills]

    import json
    try:
        required = json.loads(internship.skills_required) if internship.skills_required else []
    except:
        required = []

    match_data = calculate_match(student_skill_names, required)

    # Build reasons
    reasons = []

    if match_data['matched']:
        high_priority_matched = match_data['matched'][:5]
        reasons.append({
            'type': 'positive',
            'text': f"You match {len(match_data['matched'])} of {match_data['total']} required skills"
        })

    if match_data['missing']:
        missing_text = ', '.join(match_data['missing'][:5])
        reasons.append({
            'type': 'negative',
            'text': f"Missing {len(match_data['missing'])} skills: {missing_text}"
        })

    if not match_data['matched'] and not match_data['missing']:
        reasons.append({
            'type': 'neutral',
            'text': 'No skills required for this internship'
        })

    return jsonify({
        'internship_id': internship.id,
        'title': internship.title,
        'match_score': match_data['score'],
        'matched_skills': match_data['matched'],
        'missing_skills': match_data['missing'],
        'total_required': match_data['total'],
        'reasons': reasons
    }), 200


@internship_bp.route('/<int:internship_id>/apply', methods=['POST'])
@token_required
def apply_internship(current_user, internship_id):
    """Apply to an internship"""
    if current_user.role != 'student':
        return jsonify({'error': 'Only students can apply'}), 403

    internship = db.session.get(Internship, internship_id)
    if not internship:
        return jsonify({'error': 'Internship not found'}), 404

    # Check if already applied
    existing = Application.query.filter_by(
        student_id=current_user.id,
        internship_id=internship_id
    ).first()

    if existing:
        return jsonify({'error': 'Already applied to this internship'}), 400

    # Get student skills
    skills = Skill.query.filter_by(user_id=current_user.id).all()
    student_skill_names = [s.name for s in skills]

    import json
    try:
        required = json.loads(internship.skills_required) if internship.skills_required else []
    except:
        required = []

    match_data = calculate_match(student_skill_names, required)

    # Create application
    application = Application(
        student_id=current_user.id,
        internship_id=internship_id,
        status='pending',
        match_score=match_data['score']
    )

    db.session.add(application)
    db.session.commit()

    return jsonify({
        'message': 'Applied successfully',
        'application': application.to_dict()
    }), 201


@internship_bp.route('/my-applications', methods=['GET'])
@token_required
def my_applications(current_user):
    """Get student's applications"""
    if current_user.role != 'student':
        return jsonify({'error': 'Access denied'}), 403

    applications = Application.query.filter_by(student_id=current_user.id).all()

    result = []
    for app in applications:
        internship = db.session.get(Internship, app.internship_id)
        if internship:
            company = db.session.get(User, internship.company_id)
            result.append({
                'id': app.id,
                'internship_id': internship.id,
                'title': internship.title,
                'company': company.company_name or company.name if company else 'Unknown',
                'status': app.status,
                'match_score': app.match_score,
                'applied_at': app.applied_at.isoformat() if app.applied_at else None
            })

    return jsonify({'applications': result}), 200


@internship_bp.route('/all', methods=['GET'])
def get_all_internships():
    """Public endpoint — get all active internships"""
    internships = Internship.query.filter_by(status='active').all()

    result = []
    for internship in internships:
        company = db.session.get(User, internship.company_id)
        result.append({
            'id': internship.id,
            'title': internship.title,
            'company': company.company_name or company.name if company else 'Unknown',
            'location': internship.location,
            'duration': internship.duration,
            'stipend': internship.stipend,
            'type': internship.type,
            'description': internship.description
        })

    return jsonify({'internships': result}), 200