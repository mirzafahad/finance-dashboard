from datetime import datetime
from decimal import Decimal
from enum import StrEnum, auto
from typing import Optional
from pydantic import Field, ConfigDict
from pydantic import BaseModel as PyBaseModel


class BaseModel(PyBaseModel):
    # Allowing base models to have arbitrary (custom) types
    model_config = ConfigDict(arbitrary_types_allowed=True)


class TransactionType(StrEnum):
    """
    Types of transactions.
    """

    INCOME = auto()
    EXPENSE = auto()
    TRANSFER = auto()


class Category(StrEnum):
    """
    Transaction categories.
    """

    # Income categories
    SALARY = auto()
    FREELANCE = auto()
    INVESTMENT = auto()
    OTHER_INCOME = auto()

    # Expense categories
    FOOD = auto()
    TRANSPORT = auto()
    ENTERTAINMENT = auto()
    UTILITIES = auto()
    RENT = auto()
    SHOPPING = auto()
    HEALTHCARE = auto()
    EDUCATION = auto()
    OTHER_EXPENSE = auto()

    # Transfer category
    TRANSFER = auto()


# Pydantic models for API requests/responses
class TransactionBase(BaseModel):
    """
    Base transaction model.
    """

    amount: Decimal = Field(..., gt=0, description="Transaction amount (positive)")
    description: str = Field(..., min_length=1, max_length=255)
    category: Category
    transaction_type: TransactionType
    date: datetime = Field(default_factory=datetime.now)


class TransactionCreate(TransactionBase):
    """
    Model for creating a new transaction.
    """

    pass


class TransactionResponse(TransactionBase):
    """
    Model for transaction responses.
    """

    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AccountBase(BaseModel):
    """
    Base account model.
    """

    name: str = Field(..., min_length=1, max_length=100)
    account_type: str = Field(..., min_length=1, max_length=50)
    balance: Decimal = Field(default=Decimal("0.00"))


class AccountCreate(AccountBase):
    """
    Model for creating a new account.
    """

    pass


class AccountResponse(AccountBase):
    """
    Model for account responses.
    """

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    """
    Model for dashboard summary data.
    """

    total_income: Decimal
    total_expenses: Decimal
    net_worth: Decimal
    transaction_count: int
    top_expense_category: Optional[str] = None
