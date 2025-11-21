import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import List, Optional

class EmailNotificationService:
    """Simple email notification service using Python's built-in SMTP."""
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SENDER_EMAIL')
        self.sender_password = os.getenv('SENDER_PASSWORD')
    def send_email(self, recipient_email: str, subject: str, body: str, is_html: bool = False) -> bool:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.sender_email
            msg['To'] = recipient_email
            mime_type = 'html' if is_html else 'plain'
            msg.attach(MIMEText(body, mime_type))
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"Email send failed: {str(e)}")
            return False
    def send_registration_confirmation(self, agronomist_email: str, name: str, registration_type: str) -> bool:
        subject = "Plant Health Diagnosis Tool - Registration Successful"
        body = f"""
Dear {name},

Your {registration_type} registration has been submitted successfully!
Your profile is under verification. We will verify your documents within 24 hours.
You'll receive an email once your profile is approved and ready to start consultations.
Registration Type: {registration_type}
Verification Timeline: Up to 24 hours

Best regards,
Plant Health Diagnosis Team
        """
        return self.send_email(agronomist_email, subject, body)
    def send_verification_approved(self, agronomist_email: str, name: str, agronomist_id: str) -> bool:
        subject = "Congratulations! Your Profile is Verified"
        body = f"""
Dear {name},

Great news! Your profile has been verified and approved.
You can now:
- Accept consultation requests from users
- Generate diagnostic reports
- Earn commissions on your consultations (70% of ₹299 per consultation)
Your Agronomist ID: {agronomist_id}
Start earning by logging into your account now!

Best regards,
Plant Health Diagnosis Team
        """
        return self.send_email(agronomist_email, subject, body)
    def send_consultation_request_notification(self, agronomist_email: str, agronomist_name: str, 
                                               plant_issue: str, user_name: str) -> bool:
        subject = "New Consultation Request Received"
        body = f"""
Dear {agronomist_name},

You have received a new consultation request!
User: {user_name}
Issue: {plant_issue}

Log in to your account to view the request and accept or decline.
Consultation Fee: ₹299 (You earn ₹209 - 70% commission)

Best regards,
Plant Health Diagnosis Team
        """
        return self.send_email(agronomist_email, subject, body)
    def send_report_purchase_confirmation(self, user_email: str, user_name: str, report_id: str) -> bool:
        subject = "Diagnostic Report Generated - Plant Health Diagnosis"
        body = f"""
Dear {user_name},

Your diagnostic report has been generated successfully!
Report ID: {report_id}
Cost: ₹99

Log in to your account to view your comprehensive plant diagnosis report including:
- Disease/pest identification
- Severity assessment
- Organic treatment recommendations
- Prevention measures

Best regards,
Plant Health Diagnosis Team
        """
        return self.send_email(user_email, subject, body)
    def send_consultation_started_notification(self, user_email: str, user_name: str, 
                                               agronomist_name: str) -> bool:
        subject = "Your Consultation Has Started"
        body = f"""
Dear {user_name},

Your consultation with {agronomist_name} has started!
You can now:
- Chat directly with the agronomist
- Ask specific questions about your plant issue
- Receive personalized recommendations
Cost: ₹299
Start chatting now to get expert advice!

Best regards,
Plant Health Diagnosis Team
        """
        return self.send_email(user_email, subject, body)
    def send_consultation_completed_notification(self, agronomist_email: str, agronomist_name: str,
                                                  earnings: float) -> bool:
        subject = "Consultation Completed - Earnings Updated"
        body = f"""
Dear {agronomist_name},

Your consultation has been completed successfully!
Earnings: ₹{earnings:.2f} (70% commission)
This amount has been added to your account balance and will be available for collection.
Current Status: Collection-based payout (Payable upon request)
Thank you for providing excellent agricultural expertise!

Best regards,
Plant Health Diagnosis Team
        """
        return self.send_email(agronomist_email, subject, body)
    def send_verification_failed_notification(self, agronomist_email: str, name: str, reason: str) -> bool:
        subject = "Registration Verification Failed - Please Resubmit"
        body = f"""
Dear {name},

Unfortunately, your profile verification was not successful.
Reason: {reason}
Please review the requirements and resubmit your application with:
- Valid identity proof
- Proper certification or experience documentation
- Clear profile photo
We look forward to your resubmission!

Best regards,
Plant Health Diagnosis Team
        """
        return self.send_email(agronomist_email, subject, body)
    def send_bulk_notification(self, recipients: List[dict], subject: str, body: str) -> dict:
        results = {'success': 0, 'failed': 0, 'errors': []}
        for recipient in recipients:
            try:
                if self.send_email(recipient['email'], subject, body):
                    results['success'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append(f"Failed to send to {recipient['email']}")
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"Error sending to {recipient['email']}: {str(e)}")
        return results

email_service = EmailNotificationService()

def send_notification(notification_type: str, **kwargs) -> bool:
    notification_handlers = {
        'registration_confirmation': email_service.send_registration_confirmation,
        'verification_approved': email_service.send_verification_approved,
        'consultation_request': email_service.send_consultation_request_notification,
        'report_purchase': email_service.send_report_purchase_confirmation,
        'consultation_started': email_service.send_consultation_started_notification,
        'consultation_completed': email_service.send_consultation_completed_notification,
        'verification_failed': email_service.send_verification_failed_notification,
    }
    if notification_type in notification_handlers:
        return notification_handlers[notification_type](**kwargs)
    else:
        print(f"Unknown notification type: {notification_type}")
        return False

def send_email_notification(recipient_email, subject, body, is_html=False):
    """
    Top-level function so legacy code can do:
        from email_notifications import send_email_notification
    and send barebones ad-hoc emails
    """
    return email_service.send_email(recipient_email, subject, body, is_html)
