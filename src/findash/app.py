from unicodedata import category

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pathlib import Path
import pandas as pd
import io
from findash.data_contract import (
    TransactionCreate,
    TransactionResponse,
    DashboardSummary,
    TransactionType,
    Category,
)
from findash.database import get_db, create_tables
import findash.crud as crud
from decimal import Decimal

# Create FastAPI instance
app = FastAPI(title="Personal Finance Dashboard", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
create_tables()

# Get the project root directory (finance_dashboard/)
project_root = Path(__file__).parent.parent.parent

# Mount static files (your frontend folder)
frontend_path = project_root / "frontend"
if frontend_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")


# Basic route - this is like a "Hello World"
@app.get("/")
def read_root():
    return {"message": "Welcome to Personal Finance Dashboard API"}


@app.get("/favicon.ico")
async def favicon():
    return FileResponse("frontend/favicon.ico")


# Route with path parameter
@app.get("/hello/{name}")
def say_hello(name: str):
    return {"message": f"Hello {name}!"}


# Route with query parameter
@app.get("/items")
def read_items(skip: int = 0, limit: int = 10):
    return {"skip": skip, "limit": limit, "message": "This will return items"}


# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Personal Finance Dashboard"}


# REAL Transaction endpoints using database
@app.post("/transactions", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    """
    Create a new transaction.
    """
    return crud.create_transaction(db=db, transaction=transaction)


@app.get("/transactions", response_model=list[TransactionResponse])
def get_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all transactions with pagination"""
    return crud.get_transactions(db=db, skip=skip, limit=limit)


@app.get("/transactions/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get a specific transaction by ID"""
    db_transaction = crud.get_transaction(db=db, transaction_id=transaction_id)
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return db_transaction


@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Delete a transaction"""
    success = crud.delete_transaction(db=db, transaction_id=transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}


# REAL Dashboard summary using database
@app.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Get real dashboard summary from database"""
    total_income = crud.get_total_income(db)
    total_expenses = crud.get_total_expenses(db)

    return DashboardSummary(
        total_income=total_income,
        total_expenses=total_expenses,
        net_worth=total_income - total_expenses,
        transaction_count=crud.get_transaction_count(db),
        top_expense_category=crud.get_top_expense_category(db),
    )


# CSV Upload endpoint
@app.post("/transactions/upload-csv")
async def upload_transactions_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload transactions from a CSV file.
    """

    # Validate file type
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    try:
        # Read CSV content
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))

        # Expected CSV columns: amount, description, category, transaction_type, date (optional)
        required_columns = ["amount", "description", "category", "transaction_type"]
        missing_columns = []
        for col in required_columns:
            if col not in df.columns:
                missing_columns.append(col)

        if missing_columns:
            raise HTTPException(
                status_code=400, detail=f"Missing required columns: {missing_columns}"
            )

        category_str = [cat.value for cat in Category]
        transaction_type_str = [tt.value for tt in TransactionType]
        errors = []
        successful_imports = 0

        for index, row in df.iterrows():
            try:
                # Validate enum values.
                if row["category"] not in category_str:
                    errors.append(f"Row {index + 1}: Invalid category '{row['category']}'")
                    continue

                if row["transaction_type"] not in transaction_type_str:
                    errors.append(
                        f"Row {index + 1}: Invalid transaction_type '{row['transaction_type']}'"
                    )
                    continue

                # Create transaction
                transaction_data = TransactionCreate(
                    amount=Decimal(str(row["amount"])),
                    description=str(row["description"]),
                    category=Category(row["category"]),
                    transaction_type=TransactionType(row["transaction_type"]),
                )

                crud.create_transaction(db=db, transaction=transaction_data)
                successful_imports += 1

            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
                continue

        return {
            "message": "CSV processed successfully",
            "successful_imports": successful_imports,
            "total_rows": len(df),
            "errors": errors[:10],  # Limit errors shown to first 10
        }

    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except pd.errors.ParserError:
        raise HTTPException(status_code=400, detail="Invalid CSV format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")
