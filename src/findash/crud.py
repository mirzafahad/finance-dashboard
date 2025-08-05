from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from decimal import Decimal
import findash.database as database
from findash.data_contract import TransactionCreate, AccountCreate, TransactionType


# Transaction CRUD operations
def create_transaction(db: Session, transaction: TransactionCreate) -> database.Transaction:
    """
    Create a new transaction.
    """
    db_transaction = database.Transaction(
        amount=transaction.amount,
        description=transaction.description,
        category=transaction.category,
        transaction_type=transaction.transaction_type,
        date=transaction.date,
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def get_transaction(db: Session, transaction_id: int) -> database.Transaction | None:
    """
    Get a single transaction by ID.
    """
    return db.query(database.Transaction).filter(database.Transaction.id == transaction_id).first()


def get_transactions(db: Session, skip: int = 0, limit: int = 100) -> list[database.Transaction]:
    """
    Get multiple transactions with pagination.
    """
    return (
        db.query(database.Transaction)
        .order_by(desc(database.Transaction.date))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_transactions_by_category(db: Session, category: str) -> list[database.Transaction]:
    """
    Get transactions filtered by category.
    """
    return db.query(database.Transaction).filter(database.Transaction.category == category).all()


def delete_transaction(db: Session, transaction_id: int) -> bool:
    """
    Delete a transaction.
    """
    db_transaction = (
        db.query(database.Transaction).filter(database.Transaction.id == transaction_id).first()
    )
    if db_transaction:
        db.delete(db_transaction)
        db.commit()
        return True
    return False


# Dashboard/Analytics functions
def get_total_income(db: Session) -> Decimal:
    """Calculate total income"""
    result = (
        db.query(func.sum(database.Transaction.amount))
        .filter(database.Transaction.transaction_type == TransactionType.INCOME)
        .scalar()
    )
    return result or Decimal("0.00")


def get_total_expenses(db: Session) -> Decimal:
    """Calculate total expenses"""
    result = (
        db.query(func.sum(database.Transaction.amount))
        .filter(database.Transaction.transaction_type == TransactionType.EXPENSE)
        .scalar()
    )
    return result or Decimal("0.00")


def get_transaction_count(db: Session) -> int:
    """
    Get total number of transactions.
    """
    return db.query(database.Transaction).count()


def get_top_expense_category(db: Session) -> str | None:
    """
    Get the category with the highest total expenses.
    """
    result = (
        db.query(
            database.Transaction.category,
            func.sum(database.Transaction.amount)
            .label("total"),
        )
        .filter(database.Transaction.transaction_type == TransactionType.EXPENSE)
        .group_by(database.Transaction.category)
        .order_by(desc("total"))
        .first()
    )

    return result[0].value if result else None


# Account CRUD operations
def create_account(db: Session, account: AccountCreate) -> database.Account:
    """
    Create a new account.
    """
    db_account = database.Account(**account.model_dump())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


def get_accounts(db: Session) -> list[database.Account]:
    """
    Get all accounts.
    """
    return db.query(database.Account).all()
