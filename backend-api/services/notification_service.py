"""
Push Notification Service
Handles Firebase Cloud Messaging notifications for mobile and web push
Ready for FCM credentials insertion at deployment
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from enum import Enum
import queue
import threading

class NotificationPriority(Enum):
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"

class NotificationType(Enum):
    CONSULTATION_ASSIGNED = "consultation_assigned"
    CONSULTATION_MESSAGE = "consultation_message"
    CONSULTATION_COMPLETED = "consultation_completed"
    PAYMENT_COLLECTED = "payment_collected"
    PAYMENT_PENDING = "payment_pending"
    ML_ANALYSIS_COMPLETE = "ml_analysis_complete"
    REPORT_READY = "report_ready"
    SYSTEM_UPDATE = "system_update"
    ADMIN_BROADCAST = "admin_broadcast"

class NotificationService:
    """
    Manages push notifications via Firebase Cloud Messaging
    Supports device token registration, message templating, and queuing
    """
    
    def __init__(self, fcm_credentials_path: Optional[str] = None):
        self.fcm_credentials_path = fcm_credentials_path
        self.fcm_initialized = False
        self.notification_queue = queue.Queue()
        
        # Storage paths
        self.base_path = Path("./backend-api/notifications")
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        self.device_tokens_file = self.base_path / "device_tokens.json"
        self.notification_log_file = self.base_path / "notification_log.jsonl"
        self.templates_file = self.base_path / "notification_templates.json"
        
        # Load device tokens
        self.device_tokens = self._load_device_tokens()
        
        # Load or initialize templates
        self.templates = self._load_templates()
        
        # Initialize FCM if credentials provided
        if fcm_credentials_path:
            self._initialize_fcm()
        
        # Start background worker for queue processing
        self._start_worker()
    
    def _initialize_fcm(self):
        """
        Initialize Firebase Cloud Messaging
        This requires FCM credentials JSON file
        
        TODO: Uncomment and configure when FCM credentials are available
        """
        try:
            # import firebase_admin
            # from firebase_admin import credentials, messaging
            # 
            # cred = credentials.Certificate(self.fcm_credentials_path)
            # firebase_admin.initialize_app(cred)
            # self.fcm_initialized = True
            # print("FCM initialized successfully")
            
            # For now, just log that FCM is ready for initialization
            print("FCM service ready. Awaiting credentials for initialization.")
            self.fcm_initialized = False
        except Exception as e:
            print(f"FCM initialization failed: {str(e)}")
            self.fcm_initialized = False
    
    def _load_device_tokens(self) -> Dict:
        """Load device tokens from storage"""
        if self.device_tokens_file.exists():
            with open(self.device_tokens_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _save_device_tokens(self):
        """Save device tokens to storage"""
        with open(self.device_tokens_file, 'w') as f:
            json.dump(self.device_tokens, f, indent=2)
    
    def _load_templates(self) -> Dict:
        """Load notification templates"""
        if self.templates_file.exists():
            with open(self.templates_file, 'r') as f:
                return json.load(f)
        
        # Default templates
        return {
            "consultation_assigned": {
                "title": "New Consultation Assigned",
                "body": "You have been assigned a new consultation from {farmer_name}. Tap to view details.",
                "icon": "consultation_icon",
                "sound": "default"
            },
            "consultation_message": {
                "title": "New Message",
                "body": "You have a new message in consultation #{consultation_id}",
                "icon": "message_icon",
                "sound": "default"
            },
            "consultation_completed": {
                "title": "Consultation Completed",
                "body": "Your consultation has been completed. Please review and mark payment as collected.",
                "icon": "check_icon",
                "sound": "default"
            },
            "payment_collected": {
                "title": "Payment Collected",
                "body": "Payment of ₹{amount} has been marked as collected.",
                "icon": "payment_icon",
                "sound": "default"
            },
            "payment_pending": {
                "title": "Payment Pending",
                "body": "You have ₹{amount} pending in consultation #{consultation_id}. Please collect and mark as paid.",
                "icon": "payment_icon",
                "sound": "default"
            },
            "ml_analysis_complete": {
                "title": "Analysis Complete",
                "body": "Your plant health analysis is ready. Tap to view results.",
                "icon": "plant_icon",
                "sound": "default"
            },
            "report_ready": {
                "title": "Detailed Report Ready",
                "body": "Your detailed plant health report is now available for download.",
                "icon": "report_icon",
                "sound": "default"
            },
            "system_update": {
                "title": "System Update",
                "body": "{message}",
                "icon": "notification_icon",
                "sound": "default"
            },
            "admin_broadcast": {
                "title": "{title}",
                "body": "{body}",
                "icon": "notification_icon",
                "sound": "default"
            }
        }
    
    def _save_templates(self):
        """Save templates to storage"""
        with open(self.templates_file, 'w') as f:
            json.dump(self.templates, f, indent=2)
    
    def register_device_token(
        self,
        user_id: str,
        device_token: str,
        platform: str,
        device_info: Optional[Dict] = None
    ):
        """Register a device token for a user"""
        if user_id not in self.device_tokens:
            self.device_tokens[user_id] = []
        
        # Check if token already exists
        existing = next((t for t in self.device_tokens[user_id] if t["token"] == device_token), None)
        
        if existing:
            # Update existing token
            existing["last_updated"] = datetime.now().isoformat()
            existing["platform"] = platform
            if device_info:
                existing["device_info"] = device_info
        else:
            # Add new token
            self.device_tokens[user_id].append({
                "token": device_token,
                "platform": platform,
                "registered_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "device_info": device_info or {},
                "active": True
            })
        
        self._save_device_tokens()
    
    def unregister_device_token(self, user_id: str, device_token: str):
        """Remove a device token"""
        if user_id in self.device_tokens:
            self.device_tokens[user_id] = [
                t for t in self.device_tokens[user_id] if t["token"] != device_token
            ]
            self._save_device_tokens()
    
    def get_user_tokens(self, user_id: str) -> List[str]:
        """Get all active tokens for a user"""
        if user_id not in self.device_tokens:
            return []
        
        return [t["token"] for t in self.device_tokens[user_id] if t.get("active", True)]
    
    def send_notification(
        self,
        user_ids: List[str],
        notification_type: NotificationType,
        data: Dict,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        schedule_time: Optional[datetime] = None
    ) -> Dict:
        """
        Send notification to users
        Returns summary of sent/failed notifications
        """
        # Get template
        template_key = notification_type.value
        if template_key not in self.templates:
            return {"error": f"Template {template_key} not found"}
        
        template = self.templates[template_key]
        
        # Format message with data
        try:
            title = template["title"].format(**data)
            body = template["body"].format(**data)
        except KeyError as e:
            return {"error": f"Missing template parameter: {str(e)}"}
        
        notification = {
            "title": title,
            "body": body,
            "icon": template.get("icon"),
            "sound": template.get("sound", "default"),
            "type": notification_type.value,
            "data": data,
            "priority": priority.value,
            "timestamp": datetime.now().isoformat()
        }
        
        # Queue notification
        for user_id in user_ids:
            tokens = self.get_user_tokens(user_id)
            for token in tokens:
                self.notification_queue.put({
                    "user_id": user_id,
                    "token": token,
                    "notification": notification,
                    "schedule_time": schedule_time
                })
        
        return {
            "success": True,
            "queued": len(user_ids),
            "message": f"Notification queued for {len(user_ids)} users"
        }
    
    def _process_notification_queue(self):
        """Background worker to process notification queue"""
        while True:
            try:
                item = self.notification_queue.get(timeout=1)
                
                # Check if scheduled
                if item.get("schedule_time"):
                    if datetime.now() < item["schedule_time"]:
                        # Requeue if not time yet
                        self.notification_queue.put(item)
                        continue
                
                # Send notification
                success = self._send_fcm_notification(
                    token=item["token"],
                    notification=item["notification"]
                )
                
                # Log notification
                self._log_notification(
                    user_id=item["user_id"],
                    notification=item["notification"],
                    success=success
                )
                
                self.notification_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Error processing notification: {str(e)}")
    
    def _send_fcm_notification(self, token: str, notification: Dict) -> bool:
        """
        Send notification via FCM
        
        TODO: Uncomment when FCM is initialized with credentials
        """
        if not self.fcm_initialized:
            print(f"FCM not initialized. Would send: {notification['title']} to token: {token[:10]}...")
            return False
        
        try:
            # from firebase_admin import messaging
            # 
            # message = messaging.Message(
            #     notification=messaging.Notification(
            #         title=notification["title"],
            #         body=notification["body"],
            #         image=notification.get("icon")
            #     ),
            #     data=notification.get("data", {}),
            #     token=token,
            #     android=messaging.AndroidConfig(
            #         priority=notification.get("priority", "normal"),
            #         notification=messaging.AndroidNotification(
            #             sound=notification.get("sound", "default")
            #         )
            #     ),
            #     apns=messaging.APNSConfig(
            #         payload=messaging.APNSPayload(
            #             aps=messaging.Aps(
            #                 sound=notification.get("sound", "default")
            #             )
            #         )
            #     )
            # )
            # 
            # response = messaging.send(message)
            # return True
            
            return False
        except Exception as e:
            print(f"FCM send failed: {str(e)}")
            return False
    
    def _log_notification(self, user_id: str, notification: Dict, success: bool):
        """Log notification to file"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "type": notification["type"],
            "title": notification["title"],
            "success": success
        }
        
        with open(self.notification_log_file, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
    
    def _start_worker(self):
        """Start background worker thread"""
        worker = threading.Thread(target=self._process_notification_queue, daemon=True)
        worker.start()
    
    def broadcast_to_role(
        self,
        role: str,
        title: str,
        body: str,
        data: Optional[Dict] = None,
        priority: NotificationPriority = NotificationPriority.NORMAL
    ) -> Dict:
        """
        Broadcast notification to all users with specific role
        Note: Requires user role lookup from database
        """
        # This would query database for users with specified role
        # For now, return placeholder
        return {
            "success": True,
            "message": f"Broadcast queued for role: {role}",
            "note": "Requires database integration for user lookup"
        }
    
    def broadcast_to_region(
        self,
        region: str,
        title: str,
        body: str,
        data: Optional[Dict] = None,
        priority: NotificationPriority = NotificationPriority.NORMAL
    ) -> Dict:
        """
        Broadcast notification to all users in specific region
        Note: Requires user region lookup from database
        """
        return {
            "success": True,
            "message": f"Broadcast queued for region: {region}",
            "note": "Requires database integration for user lookup"
        }
    
    def get_notification_stats(self, days: int = 7) -> Dict:
        """Get notification statistics"""
        if not self.notification_log_file.exists():
            return {"total_sent": 0, "success_rate": 0.0}
        
        total = 0
        successful = 0
        by_type = {}
        
        with open(self.notification_log_file, 'r') as f:
            for line in f:
                log = json.loads(line)
                total += 1
                if log["success"]:
                    successful += 1
                
                notif_type = log["type"]
                if notif_type not in by_type:
                    by_type[notif_type] = {"total": 0, "successful": 0}
                by_type[notif_type]["total"] += 1
                if log["success"]:
                    by_type[notif_type]["successful"] += 1
        
        return {
            "total_sent": total,
            "successful": successful,
            "success_rate": round(successful / total, 4) if total > 0 else 0.0,
            "by_type": by_type,
            "queue_size": self.notification_queue.qsize()
        }

# Singleton instance
_notification_service = None

def get_notification_service(fcm_credentials_path: Optional[str] = None) -> NotificationService:
    """Get or create notification service singleton"""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService(fcm_credentials_path)
    return _notification_service
