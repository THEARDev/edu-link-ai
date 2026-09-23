"""
Resume Upload API — Extract skills from resume
"""

import os
import uuid

from flask import Blueprint, request, jsonify

from models import db, Skill
from auth import token_required
from ml.skill_extractor import parse_resume

resume_bp = Blueprint('resume', __name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@resume_bp.route('/upload', methods=['POST'])
@token_required
def upload_resume(current_user):
    """Upload resume and extract skills"""
    if current_user.role != 'student':
        return jsonify({'error': 'Only students can upload resumes'}), 403

    # Check file
    if 'resume' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['resume']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    if file_size > MAX_FILE_SIZE:
        return jsonify({'error': 'File size must be under 5 MB'}), 400

    # Save file
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_name)
    file.save(file_path)

    try:
        # Parse resume
        result = parse_resume(file_path)
        extracted_skills = result['skills']

        # Save skills to database (avoid duplicates)
        added_skills = []
        for skill_data in extracted_skills:
            existing = Skill.query.filter_by(
                user_id=current_user.id,
                name=skill_data['name']
            ).first()

            if not existing:
                skill = Skill(
                    user_id=current_user.id,
                    name=skill_data['name'],
                    level=skill_data['level'],
                    source='resume'
                )
                db.session.add(skill)
                added_skills.append(skill_data)

        db.session.commit()

        return jsonify({
            'message': f'Resume uploaded. {len(added_skills)} new skills extracted.',
            'skills': added_skills,
            'total_extracted': len(extracted_skills),
            'new_skills': len(added_skills)
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to process resume: {str(e)}'}), 500

    finally:
        # Clean up file
        if os.path.exists(file_path):
            os.remove(file_path)