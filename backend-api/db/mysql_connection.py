"""MySQL Database Connection Manager
Handles MySQL connections with connection pooling for better performance
"""

import mysql.connector
from mysql.connector import pooling, Error
import os
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'gzkrits'),
    'database': os.getenv('DB_NAME', 'plant_health_db'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'autocommit': True,
    'pool_name': 'plant_health_pool',
    'pool_size': 5,
    'pool_reset_session': True
}

# Initialize connection pool
try:
    connection_pool = pooling.MySQLConnectionPool(**DB_CONFIG)
    logger.info("MySQL connection pool created successfully")
except Error as e:
    logger.error(f"Error creating connection pool: {e}")
    connection_pool = None


def get_db_connection():
    """Get a connection from the pool"""
    try:
        connection = connection_pool.get_connection()
        if connection.is_connected():
            return connection
    except Error as e:
        logger.error(f"Error getting connection from pool: {e}")
        return None


def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
    """
    Execute a database query
    
    Args:
        query: SQL query string
        params: Query parameters (tuple)
        fetch_one: Return single row
        fetch_all: Return all rows
        commit: Commit transaction (for INSERT/UPDATE/DELETE)
    
    Returns:
        Query results or affected row count
    """
    connection = None
    cursor = None
    
    try:
        connection = get_db_connection()
        if not connection:
            return None
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, params or ())
        
        if commit:
            connection.commit()
            return cursor.lastrowid if cursor.lastrowid else cursor.rowcount
        
        if fetch_one:
            return cursor.fetchone()
        
        if fetch_all:
            return cursor.fetchall()
        
        return cursor.rowcount
    
    except Error as e:
        logger.error(f"Database error: {e}")
        if connection:
            connection.rollback()
        return None
    
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def execute_many(query, data_list):
    """
    Execute multiple queries (batch insert/update)
    
    Args:
        query: SQL query with placeholders
        data_list: List of tuples with data
    
    Returns:
        Number of affected rows
    """
    connection = None
    cursor = None
    
    try:
        connection = get_db_connection()
        if not connection:
            return 0
        
        cursor = connection.cursor()
        cursor.executemany(query, data_list)
        connection.commit()
        return cursor.rowcount
    
    except Error as e:
        logger.error(f"Batch execution error: {e}")
        if connection:
            connection.rollback()
        return 0
    
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def test_connection():
    """Test database connection"""
    connection = get_db_connection()
    if connection:
        try:
            cursor = connection.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            cursor.close()
            connection.close()
            return result is not None
        except Error as e:
            logger.error(f"Connection test failed: {e}")
            return False
    return False


if __name__ == '__main__':
    # Test the connection
    if test_connection():
        print("✅ MySQL connection successful!")
    else:
        print("❌ MySQL connection failed!")
