"""Chat Routes - Real-time consultation chat between users and agronomists"""

from flask import Blueprint, request, jsonify, websocket
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from functools import wraps
import sqlite3
import json
from email_notifications import send_email_notification

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')
DB_PATH = 'database.db'

# WebSocket connection manager for real-time chat
class ConnectionManager:
    def __init__(self):
        self.active_connections = {}
    
    def connect(self, consultation_id, user_id, websocket_conn):
        if consultation_id not in self.active_connections:
            self.active_connections[consultation_id] = {}
        self.active_connections[consultation_id][user_id] = websocket_conn
    
    def disconnect(self, consultation_id, user_id):
        if consultation_id in self.active_connections:
            del self.active_connections[consultation_id][user_id]
            if not self.active_connections[consultation_id]:
                del self.active_connections[consultation_id]
    
    async def broadcast(self, consultation_id, message):
        if consultation_id in self.active_connections:
            for user_id, connection in self.active_connections[consultation_id].items():
                try:
                    await connection.send(json.dumps(message))
                except:
                    pass

manager = ConnectionManager()

@chat_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    """Send a message in consultation chat"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        consultation_id = data.get('consultation_id')
        message_text = data.get('message')
        
        if not consultation_id or not message_text:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Verify user is part of this consultation
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, user_id, agronomist_id, status FROM consultations 
            WHERE id = ?
        ''', (consultation_id,))
        consultation = cursor.fetchone()
        
        if not consultation:
            conn.close()
            return jsonify({'error': 'Consultation not found'}), 404
        
        cons_id, cons_user_id, agronomist_id, status = consultation
        
        # Check authorization
        if user_id != cons_user_id and user_id != agronomist_id:
            conn.close()
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Insert message
        cursor.execute('''
            INSERT INTO chat_messages (consultation_id, sender_id, message, timestamp)
            VALUES (?, ?, ?, ?)
        ''', (consultation_id, user_id, message_text, datetime.utcnow()))
        
        message_id = cursor.lastrowid
        conn.commit()
        
        # Get receiver info
        receiver_id = agronomist_id if user_id == cons_user_id else cons_user_id
        cursor.execute('SELECT email FROM users WHERE id = ?', (receiver_id,))
        receiver = cursor.fetchone()
        
        conn.close()
        
        # Send notification email to receiver
        if receiver:
            sender_type = 'Farmer' if user_id == cons_user_id else 'Agronomist'
            send_email_notification(
                receiver[0],
                f'New message from {sender_type} in Consultation',
                f'You have a new message: {message_text[:100]}...\n\nConsultation ID: {consultation_id}'
            )
        
        return jsonify({
            'message_id': message_id,
            'consultation_id': consultation_id,
            'sender_id': user_id,
            'message': message_text,
            'timestamp': datetime.utcnow().isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/<int:consultation_id>/history', methods=['GET'])
@jwt_required()
def get_chat_history(consultation_id):
    """Get chat history for a consultation"""
    try:
        user_id = get_jwt_identity()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verify authorization
        cursor.execute('''
            SELECT user_id, agronomist_id FROM consultations WHERE id = ?
        ''', (consultation_id,))
        consultation = cursor.fetchone()
        
        if not consultation:
            conn.close()
            return jsonify({'error': 'Consultation not found'}), 404
        
        user_check, agronomist_check = consultation
        if user_id != user_check and user_id != agronomist_check:
            conn.close()
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Fetch messages with pagination
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        cursor.execute('''
            SELECT id, sender_id, message, timestamp FROM chat_messages 
            WHERE consultation_id = ?
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        ''', (consultation_id, limit, offset))
        
        messages = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'consultation_id': consultation_id,
            'messages': [
                {
                    'message_id': msg[0],
                    'sender_id': msg[1],
                    'message': msg[2],
                    'timestamp': msg[3]
                }
                for msg in reversed(messages)
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/<int:consultation_id>/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count(consultation_id):
    """Get unread message count"""
    try:
        user_id = get_jwt_identity()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT COUNT(*) FROM chat_messages 
            WHERE consultation_id = ? AND sender_id != ?
        ''', (consultation_id, user_id))
        
        count = cursor.fetchone()[0]
        conn.close()
        
        return jsonify({
            'consultation_id': consultation_id,
            'unread_count': count
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/<int:consultation_id>/mark-read', methods=['POST'])
@jwt_required()
def mark_messages_read(consultation_id):
    """Mark messages as read"""
    try:
        user_id = get_jwt_identity()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE chat_messages 
            SET is_read = 1
            WHERE consultation_id = ? AND sender_id != ?
        ''', (consultation_id, user_id))
        
        conn.commit()
        rows_updated = cursor.rowcount
        conn.close()
        
        return jsonify({
            'consultation_id': consultation_id,
            'messages_marked_read': rows_updated
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/<int:consultation_id>/end', methods=['POST'])
@jwt_required()
def end_consultation_chat(consultation_id):
    """End chat session and close consultation"""
    try:
        user_id = get_jwt_identity()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verify authorization - only agronomist can end
        cursor.execute('''
            SELECT user_id, agronomist_id, status FROM consultations WHERE id = ?
        ''', (consultation_id,))
        consultation = cursor.fetchone()
        
        if not consultation:
            conn.close()
            return jsonify({'error': 'Consultation not found'}), 404
        
        user_id_check, agronomist_id, status = consultation
        
        # Only agronomist can end consultation
        if user_id != agronomist_id:
            conn.close()
            return jsonify({'error': 'Only agronomist can end consultation'}), 403
        
        if status == 'completed':
            conn.close()
            return jsonify({'error': 'Consultation already completed'}), 400
        
        # Update consultation status
        cursor.execute('''
            UPDATE consultations 
            SET status = 'completed', ended_at = ?
            WHERE id = ?
        ''', (datetime.utcnow(), consultation_id))
        
        conn.commit()
        
        # Notify user
        cursor.execute('SELECT email FROM users WHERE id = ?', (user_id_check,))
        user_email = cursor.fetchone()
        conn.close()
        
        if user_email:
            send_email_notification(
                user_email[0],
                'Consultation Completed',
                f'Your consultation (ID: {consultation_id}) has been completed by the agronomist.'
            )
        
        return jsonify({
            'message': 'Consultation ended',
            'consultation_id': consultation_id,
            'ended_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
