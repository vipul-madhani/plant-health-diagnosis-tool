from plant_db_routes import plant_db_bp
from activity_routes import activity_bp
from stats_user_routes import stats_bp

app.register_blueprint(plant_db_bp)
app.register_blueprint(activity_bp)
app.register_blueprint(stats_bp)
