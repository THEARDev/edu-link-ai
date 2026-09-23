"""
Authentication APIs — Signup, Login
"""

from datetime import datetime, timedelta
from functools import wraps

import jwt
import bcrypt
from flask import Blueprint, request, jsonify, current_app

from models import db, User

auth_bp = Blueprint('auth', __name__)


# ---------- HELPERS ----------

def hash_password(password: str) -> str:
    """Hash password with bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    try:
        return bcrypt.checkpw(
            password.encode('utf-8'),
            password_hash.encode('utf-8')
        )
    except Exception:
        return False


def create_token(user_id: int, role: str) -> str:
    """Create JWT token"""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    return jwt.encode(
        payload,
        current_app.config['JWT_SECRET'],
        algorithm='HS256'
    )


def token_required(f):
    """Decorator to protect routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET'],
                algorithms=['HS256']
            )
            current_user = db.session.get(User, payload['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


# ---------- ROUTES ----------

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register new user"""
    data = request.get_json()

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', '')

    if not name or not email or not password or not role:
        return jsonify({'error': 'All fields are required'}), 400

    if role not in ['student', 'college', 'company']:
        return jsonify({'error': 'Invalid role'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'error': 'Email already registered'}), 400

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role=role,
        college_name=data.get('college_name'),
        company_name=data.get('company_name')
    )

    db.session.add(user)
    db.session.commit()

    token = create_token(user.id, user.role)

    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    data = request.get_json()

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not verify_password(password, user.password_hash):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is disabled'}), 403

    token = create_token(user.id, user.role)

    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me(current_user):
    """Get current user info"""
    return jsonify({'user': current_user.to_dict()}), 200