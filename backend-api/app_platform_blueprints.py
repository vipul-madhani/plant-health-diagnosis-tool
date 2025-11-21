from plant_db_routes import plant_db_bp
from activity_routes import activity_bp
from stats_user_routes import stats_bp
from agro_reg_routes import agro_reg_bp
from user_auth_routes import user_auth_bp

app.register_blueprint(plant_db_bp)
app.register_blueprint(activity_bp)
app.register_blueprint(stats_bp)
app.register_blueprint(agro_reg_bp)
app.register_blueprint(user_auth_bp)
