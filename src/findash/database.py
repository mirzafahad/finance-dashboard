from sqlalchemy import create_engine, Column, Integer, String, DateTime, Enum, DECIMAL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, UTC
from findash.data_contract import TransactionType, Category
from pathlib import Path

# Create database directory and file path
db_dir = Path(__file__).parent.parent.parent / "data"
db_dir.mkdir(exist_ok=True)
DATABASE_URL = f"sqlite:///{db_dir}/finance.db"

# SQLAlchemy setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Database Models (SQLAlchemy)
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(DECIMAL(10, 2), nullable=False)
    description = Column(String(255), nullable=False)
    category = Column(Enum(Category), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    date = Column(DateTime, default=datetime.now(UTC))
    created_at = Column(DateTime, default=datetime.now(UTC))


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    account_type = Column(String(50), nullable=False)
    balance = Column(DECIMAL(10, 2), default=0.00)
    created_at = Column(DateTime, default=datetime.now(UTC))
    updated_at = Column(DateTime, default=datetime.now(UTC), onupdate=datetime.now(UTC))


# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)
