"""
Error Handling Utilities
Centralized error responses and exception handling
"""

from flask import jsonify
import logging

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base API Exception"""
    status_code = 400
    
    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload
    
    def to_dict(self):
        rv = dict(self.payload or ())
        rv['error'] = self.message
        rv['success'] = False
        return rv


class ValidationError(APIError):
    """Validation Error - 400"""
    status_code = 400


class AuthenticationError(APIError):
    """Authentication Error - 401"""
    status_code = 401


class AuthorizationError(APIError):
    """Authorization Error - 403"""
    status_code = 403


class NotFoundError(APIError):
    """Resource Not Found - 404"""
    status_code = 404


class ConflictError(APIError):
    """Conflict Error - 409"""
    status_code = 409


class DatabaseError(APIError):
    """Database Error - 500"""
    status_code = 500


def register_error_handlers(app):
    """Register error handlers with Flask app"""
    
    @app.errorhandler(APIError)
    def handle_api_error(error):
        """Handle custom API errors"""
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response
    
    @app.errorhandler(400)
    def bad_request(error):
        """Handle 400 errors"""
        return jsonify({
            'error': 'Bad request',
            'message': str(error),
            'success': False
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        """Handle 401 errors"""
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication required',
            'success': False
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        """Handle 403 errors"""
        return jsonify({
            'error': 'Forbidden',
            'message': 'You do not have permission to access this resource',
            'success': False
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors"""
        return jsonify({
            'error': 'Not found',
            'message': 'The requested resource was not found',
            'success': False
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        """Handle 405 errors"""
        return jsonify({
            'error': 'Method not allowed',
            'message': 'The HTTP method is not allowed for this endpoint',
            'success': False
        }), 405
    
    @app.errorhandler(413)
    def file_too_large(error):
        """Handle 413 errors"""
        return jsonify({
            'error': 'File too large',
            'message': 'The uploaded file exceeds the maximum allowed size',
            'success': False
        }), 413
    
    @app.errorhandler(422)
    def unprocessable_entity(error):
        """Handle 422 errors"""
        return jsonify({
            'error': 'Unprocessable entity',
            'message': 'The request was well-formed but contains invalid data',
            'success': False
        }), 422
    
    @app.errorhandler(429)
    def rate_limit_exceeded(error):
        """Handle 429 errors"""
        return jsonify({
            'error': 'Too many requests',
            'message': 'Rate limit exceeded. Please try again later',
            'success': False
        }), 429
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors"""
        logger.error(f'Internal server error: {str(error)}')
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred. Please try again later',
            'success': False
        }), 500
    
    @app.errorhandler(503)
    def service_unavailable(error):
        """Handle 503 errors"""
        return jsonify({
            'error': 'Service unavailable',
            'message': 'The service is temporarily unavailable. Please try again later',
            'success': False
        }), 503
    
    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        """Handle any unhandled exceptions"""
        logger.error(f'Unexpected error: {str(error)}', exc_info=True)
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred',
            'success': False
        }), 500


def success_response(data=None, message=None, status_code=200):
    """Standard success response"""
    response = {
        'success': True
    }
    
    if message:
        response['message'] = message
    
    if data is not None:
        response['data'] = data
    
    return jsonify(response), status_code


def error_response(message, status_code=400, errors=None):
    """Standard error response"""
    response = {
        'success': False,
        'error': message
    }
    
    if errors:
        response['errors'] = errors
    
    return jsonify(response), status_code
