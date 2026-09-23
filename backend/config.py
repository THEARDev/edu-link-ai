"""
Application Configuration
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # App
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')
    JWT_SECRET = os.getenv('JWT_SECRET', 'default-jwt-secret')

    # Database
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///edulink.db')
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # CORS
    CORS_ORIGINS = os.getenv(
        'CORS_ORIGINS',
        'http://127.0.0.1:5500,http://localhost:5500'
    ).split(',')

    # JWT
    JWT_EXPIRY_HOURS = 24