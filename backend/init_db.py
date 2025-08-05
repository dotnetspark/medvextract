import os
from sqlalchemy import create_engine, text
from models.database import engine, Base, init_db

# Get DB credentials from environment or config
user = os.getenv("POSTGRES_USER")
password = os.getenv("POSTGRES_PASSWORD")
host = os.getenv("POSTGRES_HOST")
port = os.getenv("POSTGRES_PORT")
target_db = os.getenv("POSTGRES_DB")

# Connect to default 'postgres' database
default_engine = create_engine(f"postgresql://{user}:{password}@{host}:{port}/medvextract_db")

with default_engine.connect() as conn:
    result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{target_db}'"))
    if not result.scalar():
        conn.execute(text(f"CREATE DATABASE {target_db}"))
        print(f"Database '{target_db}' created.")
    else:
        print(f"Database '{target_db}' already exists.")

# Now run your usual SQLAlchemy metadata.create_all() for tables
init_db()
print("Tables created.")