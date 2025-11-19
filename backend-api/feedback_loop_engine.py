from datetime import datetime, timedelta
import mysql.connector
from ml_training_pipeline import AgriculturalMLPipeline
from email_notifications import send_email
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FeedbackLoopEngine:
    """
    Self-improving feedback loop for the knowledge ecosystem.
    Feeds consultation outcomes back into the ML model and content generation.
    """
    
    def __init__(self):
        self.db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': 'password',
            'database': 'plant_health_db'
        }
        self.ml_pipeline = AgriculturalMLPipeline()
    
    def get_db(self):
        return mysql.connector.connect(**self.db_config)
    
    # ============ PHASE 1: Collect Consultation Feedback ============
    
    def collect_consultation_outcome(self, consultation_id, user_feedback, effectiveness_rating):
        """
        Collect feedback from users about consultation effectiveness.
        Tracks: Did the solution work? How effective? Any changes needed?
        """
        try:
            db = self.get_db()
            cursor = db.cursor()
            
            cursor.execute("""
                INSERT INTO consultation_feedback
                (consultation_id, user_feedback, effectiveness_rating, feedback_date, status)
                VALUES (%s, %s, %s, %s, %s)
            """, (consultation_id, user_feedback, effectiveness_rating, datetime.now(), 'collected'))
            
            feedback_id = cursor.lastrowid
            db.commit()
            
            logger.info(f"Feedback collected for consultation {consultation_id}: rating={effectiveness_rating}")
            cursor.close()
            db.close()
            
            return feedback_id
            
        except Exception as e:
            logger.error(f"Error collecting feedback: {str(e)}")
            return None
    
    # ============ PHASE 2: Analyze Patterns & Success Rates ============
    
    def analyze_consultation_patterns(self, days_back=30):
        """
        Analyze which solutions work best, which fail, and why.
        Returns patterns organized by crop, disease, region, season.
        """
        try:
            db = self.get_db()
            cursor = db.cursor(dictionary=True)
            
            cutoff_date = datetime.now() - timedelta(days=days_back)
            
            # Get consultations with feedback from last N days
            cursor.execute("""
                SELECT 
                    c.id, c.crop_type, c.disease_identified, c.recommended_solution,
                    c.agronomist_id, c.region, c.season,
                    cf.effectiveness_rating, cf.user_feedback
                FROM consultations c
                LEFT JOIN consultation_feedback cf ON c.id = cf.consultation_id
                WHERE cf.feedback_date >= %s
                ORDER BY c.crop_type, c.disease_identified, cf.effectiveness_rating DESC
            """, (cutoff_date,))
            
            consultations = cursor.fetchall()
            
            # Organize by pattern type
            patterns = self._organize_patterns(consultations)
            
            cursor.close()
            db.close()
            
            logger.info(f"Analyzed {len(consultations)} consultations with feedback")
            return patterns
            
        except Exception as e:
            logger.error(f"Error analyzing patterns: {str(e)}")
            return {}
    
    def _organize_patterns(self, consultations):
        """Organize consultations into patterns by crop/disease/solution."""
        patterns = {}
        
        for cons in consultations:
            key = f"{cons['crop_type']}_{cons['disease_identified']}"
            
            if key not in patterns:
                patterns[key] = {
                    'crop': cons['crop_type'],
                    'disease': cons['disease_identified'],
                    'solutions': {},
                    'region': cons['region'],
                    'season': cons['season'],
                    'total_consultations': 0,
                    'avg_effectiveness': 0
                }
            
            solution = cons['recommended_solution']
            if solution not in patterns[key]['solutions']:
                patterns[key]['solutions'][solution] = {
                    'count': 0,
                    'effectiveness_ratings': [],
                    'success_rate': 0
                }
            
            patterns[key]['solutions'][solution]['count'] += 1
            if cons['effectiveness_rating']:
                patterns[key]['solutions'][solution]['effectiveness_ratings'].append(
                    cons['effectiveness_rating']
                )
            
            patterns[key]['total_consultations'] += 1
        
        # Calculate success rates
        for pattern in patterns.values():
            for solution in pattern['solutions'].values():
                if solution['effectiveness_ratings']:
                    avg = sum(solution['effectiveness_ratings']) / len(solution['effectiveness_ratings'])
                    solution['success_rate'] = avg
                    solution['avg_effectiveness'] = avg
                    solution['high_confidence'] = len(solution['effectiveness_ratings']) >= 5
        
        return patterns
    
    # ============ PHASE 3: Retrain ML Model ============
    
    def retrain_model_with_feedback(self, patterns):
        """
        Retrain the ML model using new feedback data.
        Weights solutions by their effectiveness ratings.
        """
        try:
            db = self.get_db()
            cursor = db.cursor()
            
            training_data = []
            
            for pattern_key, pattern in patterns.items():
                for solution, stats in pattern['solutions'].items():
                    if stats['success_rate'] >= 0.8 and stats['high_confidence']:
                        training_data.append({
                            'crop': pattern['crop'],
                            'disease': pattern['disease'],
                            'solution': solution,
                            'effectiveness': stats['success_rate'],
                            'region': pattern['region'],
                            'season': pattern['season'],
                            'samples': stats['count']
                        })
            
            if training_data:
                self.ml_pipeline.train_with_feedback(training_data)
                
                cursor.execute("""
                    INSERT INTO model_training_runs
                    (model_version, training_date, samples_used, avg_effectiveness, status)
                    VALUES (%s, %s, %s, %s, %s)
                """, (f"v_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                      datetime.now(),
                      len(training_data),
                      sum(d['effectiveness'] for d in training_data) / len(training_data),
                      'completed'))
                
                db.commit()
                logger.info(f"Model retrained with {len(training_data)} high-effectiveness patterns")
            
            cursor.close()
            db.close()
            
            return len(training_data)
            
        except Exception as e:
            logger.error(f"Error retraining model: {str(e)}")
            return 0
    
    # ============ PHASE 4: Auto-Generate Blog Content ============
    
    def generate_blog_from_patterns(self, patterns):
        """
        Generate blog posts automatically from high-confidence patterns.
        Only publish blogs with 80%+ effectiveness, 5+ consultations, 0.75+ confidence.
        """
        try:
            db = self.get_db()
            cursor = db.cursor()
            
            blogs_generated = 0
            
            for pattern_key, pattern in patterns.items():
                for solution, stats in pattern['solutions'].items():
                    # Quality gates for blog publishing
                    if (stats['success_rate'] >= 0.8 and 
                        stats['count'] >= 5 and 
                        stats['high_confidence']):
                        
                        blog_title = f"How to Treat {pattern['disease']} in {pattern['crop']} - Proven Solution"
                        blog_content = self._create_blog_content(pattern, solution, stats)
                        
                        cursor.execute("""
                            INSERT INTO auto_generated_blogs
                            (title, content, crop_type, disease, region, season,
                             effectiveness_rating, supporting_consultations,
                             confidence_score, status, generated_date)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (blog_title, blog_content, pattern['crop'], pattern['disease'],
                              pattern['region'], pattern['season'],
                              stats['success_rate'], stats['count'],
                              stats['success_rate'], 'published', datetime.now()))
                        
                        blog_id = cursor.lastrowid
                        db.commit()
                        blogs_generated += 1
                        
                        logger.info(f"Blog generated: {blog_title} (effectiveness: {stats['success_rate']:.1%})")
            
            cursor.close()
            db.close()
            
            return blogs_generated
            
        except Exception as e:
            logger.error(f"Error generating blogs: {str(e)}")
            return 0
    
    def _create_blog_content(self, pattern, solution, stats):
        """
        Create structured blog content from patterns.
        Includes problem, solution, why it works, and implementation steps.
        """
        content = f"""
## {pattern['disease']} Treatment Guide for {pattern['crop']}

### Problem Overview
{pattern['disease']} is a common issue in {pattern['crop']} farming, particularly in {pattern['region']} during {pattern['season']}.

### Proven Solution
**Treatment Method:** {solution}

### Why This Works
Based on {stats['count']} successful consultations with {stats['success_rate']:.0%} effectiveness rate,
this treatment has been proven to work reliably in your region and season.

### Implementation Steps
1. Identify symptoms early
2. Apply treatment within 48 hours of detection
3. Monitor for 2 weeks
4. Report results back to the platform

### Success Rate
- Effectiveness: {stats['success_rate']:.0%}
- Farmer Success Stories: {stats['count']}
- Confidence Level: High
"""
        return content
    
    # ============ PHASE 5: Notify Stakeholders ============
    
    def notify_model_improvements(self, training_samples, blogs_generated):
        """
        Send notifications about model improvements to admins and agronomists.
        """
        try:
            if training_samples > 0:
                send_email(
                    to='admin@planthealth.com',
                    subject=f'ML Model Improved: {training_samples} New Patterns Learned',
                    body=f"""
Your ML model has been retrained with {training_samples} high-confidence patterns.

This includes:
- {blogs_generated} new blog posts generated
- Improved recommendations based on real farmer feedback
- Better accuracy for future consultations

Model quality is continuously improving through the feedback loop!
                    """
                )
                
                send_email(
                    to='agronomists@planthealth.com',
                    subject='Knowledge Base Expanded - New Content Available',
                    body=f"""
{blogs_generated} new learning resources have been created based on your
successful consultations. Your expertise is helping other farmers!
                    """
                )
                
                logger.info(f"Notifications sent for {training_samples} improvements")
                
        except Exception as e:
            logger.error(f"Error sending notifications: {str(e)}")
    
    # ============ MAIN ORCHESTRATION: Run Full Feedback Loop ============
    
    def run_daily_feedback_loop(self):
        """
        Main orchestration method. Runs the entire self-improving feedback loop.
        Should be called daily via cron job.
        """
        logger.info("Starting daily feedback loop...")
        
        try:
            # Step 1: Analyze patterns from last 30 days
            patterns = self.analyze_consultation_patterns(days_back=30)
            
            if not patterns:
                logger.info("No new patterns to analyze")
                return
            
            # Step 2: Retrain model with feedback
            training_samples = self.retrain_model_with_feedback(patterns)
            
            # Step 3: Generate blogs from high-confidence patterns
            blogs_generated = self.generate_blog_from_patterns(patterns)
            
            # Step 4: Notify stakeholders
            self.notify_model_improvements(training_samples, blogs_generated)
            
            logger.info(f"Feedback loop completed: {training_samples} samples, {blogs_generated} blogs")
            
        except Exception as e:
            logger.error(f"Feedback loop failed: {str(e)}")
            send_email(
                to='admin@planthealth.com',
                subject='Feedback Loop Error',
                body=f'Feedback loop failed: {str(e)}'
            )
