import sqlite3

def create_connection(db_file):
    conn = sqlite3.connect(db_file)
    return conn

def insert_consultation(conn, consultation):
    sql = ''' INSERT INTO consultations(user_id, plant_type, issue, date)
              VALUES(?,?,?,?) '''
    cur = conn.cursor()
    cur.execute(sql, consultation)
    conn.commit()
    return cur.lastrowid
# Add more CRUD functions as needed...
