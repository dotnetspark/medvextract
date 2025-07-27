from models.database import init_db

if __name__ == "__main__":
    print("Initializing MedVextract database...")
    init_db()
    print("Database initialized successfully.")