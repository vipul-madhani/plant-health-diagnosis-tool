"""Blog Routes - Educational content with effectiveness metrics and engagement"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import sqlite3
import uuid
from email_notifications import send_email_notification

# Exported router for app.py compatibility
router = Blueprint('blog', __name__, url_prefix='/api/blog')
blog_bp = router
DB_PATH = 'database.db'

MIN_EFFECTIVENESS_SCORE = 0.80

@router.route('/submit', methods=['POST'])
@jwt_required()
def submit_blog_post():
    ...
# (rest of code unchanged, change every @blog_bp.route to @router.route)
