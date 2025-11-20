"""
Flask Security Headers Enforcement
"""
from flask_talisman import Talisman

def setup_security_headers(app):
    """Apply secure headers and HTTPS enforcement to a Flask app using Flask-Talisman."""
    csp = {
        'default-src': ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:'],
        'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
        'style-src': ["'self'", 'https://fonts.googleapis.com'],
    }
    Talisman(
        app,
        content_security_policy=csp,
        force_https=True,
        frame_options='DENY',
        strict_transport_security=True,
        strict_transport_security_max_age=31536000,
        session_cookie_secure=True,
        session_cookie_http_only=True,
        x_content_type_options='nosniff',
        x_xss_protection=True
    )
