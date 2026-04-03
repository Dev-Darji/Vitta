from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import asyncio
# --- FIX FOR PASSLIB/BCRYPT COMPATIBILITY ---
import bcrypt
# Some versions of passlib look for __about__.__version__ which is missing in bcrypt 4.x
if not hasattr(bcrypt, "__about__"):
    class About:
        __version__ = getattr(bcrypt, "__version__", "4.0.0")
    bcrypt.__about__ = About()
# ------------------------------------------
from passlib.context import CryptContext
from jose import JWTError, jwt
import pandas as pd
import io
import PyPDF2
import re
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging at the top
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Clean environment variables (Render sometimes adds quotes)
def get_env(key, default=None):
    val = os.environ.get(key, default)
    if val and isinstance(val, str):
        return val.strip("'\"")
    return val

# MongoDB connection with timeout
mongo_url = get_env('MONGO_URL')
if not mongo_url:
    logger.error("MONGO_URL not found in environment!")
    # Fallback to a dummy if missing to prevent startup crash, but it will fail on use
    mongo_url = "mongodb://localhost:27017"

client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
db = client[get_env('DB_NAME', 'vitta_database')]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = get_env("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# ==================== ERROR HANDLING ====================

class VittaException(HTTPException):
    def __init__(self, status_code: int, detail: str, error_code: str, suggestion: str = None):
        super().__init__(status_code=status_code, detail={
            "error_code": error_code,
            "detail": detail,
            "suggestion": suggestion
        })

class NotFoundError(VittaException):
    def __init__(self, resource: str, id: str = None):
        detail = f"{resource} with ID {id} not found" if id else f"{resource} not found"
        super().__init__(404, detail, f"{resource.upper()}_NOT_FOUND", "Please select a valid record.")

class AuthError(VittaException):
    def __init__(self, detail: str, suggestion: str = "Please log in again."):
        super().__init__(401, detail, "AUTH_ERROR", suggestion)

class ValidationError(VittaException):
    def __init__(self, detail: str, error_code: str = "VALIDATION_ERROR"):
        super().__init__(422, detail, error_code, "Check the provided data fields.")

class DatabaseError(VittaException):
    def __init__(self, detail: str):
        super().__init__(500, detail, "DATABASE_ERROR", "Ensure your MongoDB connectivity is stable.")

class SystemConfig(BaseModel):
    id: str = "global_config"
    features: Dict[str, bool] = {
        "dashboard": True,
        "clients": True,
        "accounts": True,
        "transactions": True,
        "invoices": True,
        "reports": True,
        "gst_reports": True,
        "automation": True,
        "audit_trail": True,
        "settings": True
    }
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Create the main app without a prefix
app = FastAPI()

# Add CORS middleware IMMEDIATELY after creating app to ensure it wraps everything
cors_origins_str = get_env('CORS_ORIGINS', 'http://localhost:3000,https://vitta-theta.vercel.app')
allowed_origins = [origin.strip() for origin in cors_origins_str.split(',') if origin.strip()]
extra_origins = ["https://vitta-theta.vercel.app", "http://localhost:3000", "http://localhost:3001"]
for origin in extra_origins:
    if origin not in allowed_origins:
        allowed_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "environment": "production" if "render" in str(os.environ.get("HOSTNAME", "")) else "local"}

@app.get("/")
async def root():
    return {"message": "Vitta API is running"}

# ==================== MODELS ====================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    business_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClientCreate(BaseModel):
    name: str
    business_type: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    currency: str = "INR"
    country: str = "India"
    notes: Optional[str] = None

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    business_type: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    currency: str
    country: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class BankAccountCreate(BaseModel):
    client_id: str
    account_name: str
    account_type: str # "Bank", "Cash", "Card"
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    opening_balance: float = 0.0
    opening_balance_date: str
    currency: str = "INR"
    notes: Optional[str] = None

class BankAccount(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    client_id: str
    account_name: str
    account_type: str
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    balance: float
    opening_balance: float
    opening_balance_date: str
    currency: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BankAccountUpdate(BaseModel):
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    opening_balance: Optional[float] = None
    opening_balance_date: Optional[str] = None
    balance: Optional[float] = None
    notes: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    type: str  # "income" or "expense"
    color: str = "#0F392B"
    schedule_iii_head: Optional[str] = None # e.g. "Employee Benefits", "Finance Costs"

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    type: str
    color: str
    schedule_iii_head: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    account_id: str
    date: str
    description: str # Particulars
    amount: float
    type: str  # "debit" (out) or "credit" (in)
    category_id: Optional[str] = None # Group ID
    ledger_name: Optional[str] = None
    group_name: Optional[str] = None
    reference_number: Optional[str] = None
    cheque_number: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[dict] = None

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    account_id: str
    date: str
    description: str
    amount: float
    type: str
    category_id: Optional[str] = None
    ledger_name: Optional[str] = None
    group_name: Optional[str] = None
    reference_number: Optional[str] = None
    cheque_number: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvoiceItem(BaseModel):
    item_id: str
    name: str
    description: Optional[str] = None
    hsn_sac: str
    quantity: float
    unit: str
    rate: float
    tax_rate: float
    discount_percent: float = 0
    taxable_value: float
    cgst_rate: float = 0
    cgst_amount: float = 0
    sgst_rate: float = 0
    sgst_amount: float = 0
    igst_rate: float = 0
    igst_amount: float = 0
    total_amount: float

class HSNSummary(BaseModel):
    hsn_sac: str
    taxable_value: float
    tax_rate: float
    cgst_amount: float = 0
    sgst_amount: float = 0
    igst_amount: float = 0
    total_tax: float

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    client_id: str
    invoice_number: str
    invoice_type: str = "Tax Invoice" # Tax Invoice or Bill of Supply
    invoice_date: str
    due_date: Optional[str] = None
    place_of_supply: str # State name
    billing_address: str
    shipping_address: Optional[str] = None
    gstin_customer: Optional[str] = None
    items: List[InvoiceItem]
    hsn_summary: List[HSNSummary]
    subtotal: float
    total_tax: float
    cgst_total: float = 0
    sgst_total: float = 0
    igst_total: float = 0
    round_off: float = 0
    grand_total: float
    grand_total_words: str
    status: str = "Draft" # Draft, Sent, Paid, Void
    notes: Optional[str] = None
    terms: Optional[str] = None
    irn: Optional[str] = None # For E-Invoice
    signed_qr_code: Optional[str] = None # For E-Invoice
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    currency: str = "INR"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None

class InvoiceCreate(BaseModel):
    client_id: str
    invoice_date: str
    due_date: Optional[str] = None
    place_of_supply: str
    billing_address: str
    shipping_address: Optional[str] = None
    gstin_customer: Optional[str] = None
    items: List[InvoiceItem]
    hsn_summary: List[HSNSummary]
    subtotal: float
    total_tax: float
    cgst_total: float = 0
    sgst_total: float = 0
    igst_total: float = 0
    round_off: float = 0
    grand_total: float
    grand_total_words: str
    status: str = "Draft"
    notes: Optional[str] = None
    terms: Optional[str] = None
    currency: str = "INR"

class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    action: str  # create, update, delete, login, export
    resource: str # invoice, transaction, account, category, user
    resource_id: Optional[str] = None
    details: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ip_address: Optional[str] = None

class AutomationRuleCreate(BaseModel):
    keyword: str
    category_id: str
    is_active: bool = True

class AutomationRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    keyword: str
    category_id: str
    is_active: bool
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    # 1. Revenue (Paid Invoices this month)
    today = datetime.now()
    month_pattern = f"^{today.year}-{today.month:02d}" # YYYY-MM prefix for ISO
    
    # PAID Invoices in current month
    paid_invoices = await db.invoices.find({
        "user_id": current_user.id,
        "status": "paid",
        "paid_at": {"$regex": month_pattern}
    }).to_list(1000)
    month_revenue = sum(inv.get('grand_total', inv.get('total', 0)) for inv in paid_invoices)
    
    # 2. Receivables (Sent/Overdue Invoices)
    receivable_invoices = await db.invoices.find({
        "user_id": current_user.id,
        "status": {"$in": ["sent", "overdue"]}
    }).to_list(1000)
    total_receivable = sum(inv.get('balance_due', 0) for inv in receivable_invoices)
    
    # 3. Expenses (Debit Transactions this month)
    # Transactions use DD-MM-YYYY, so we need a different pattern
    txn_month_pattern = f"-{today.month:02d}-{today.year}"
    debit_txns = await db.transactions.find({
        "user_id": current_user.id,
        "type": "debit",
        "date": {"$regex": txn_month_pattern}
    }).to_list(1000)
    month_expenses = sum(t['amount'] for t in debit_txns)
    
    # 4. Cash Balance (All Accounts)
    accounts = await db.accounts.find({"user_id": current_user.id}).to_list(100)
    total_cash = sum(a.get('balance', 0) for a in accounts)
    
    # 5. Recent Activity (Audit Logs)
    recent_logs = await db.audit_logs.find({"user_id": current_user.id})\
                                     .sort("timestamp", -1)\
                                     .limit(10)\
                                     .to_list(10)
    for log in recent_logs:
        log.pop("_id", None)
        if isinstance(log.get('timestamp'), str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
            
    # 6. Outstanding List
    outstanding_invoices = await db.invoices.find({
        "user_id": current_user.id,
        "status": {"$in": ["sent", "overdue"]}
    }).sort("due_date", 1).limit(5).to_list(5)
    
    return {
        "revenue_month": month_revenue,
        "receivable_total": total_receivable,
        "expense_month": month_expenses,
        "cash_total": total_cash,
        "recent_activity": recent_logs,
        "outstanding_list": outstanding_invoices
    }

# ==================== CLIENT RESOURCE ROUTES ====================

@api_router.get("/clients/{id}/invoices")
async def get_client_invoices(id: str, current_user: User = Depends(get_current_user)):
    docs = await db.invoices.find({"client_id": id, "user_id": current_user.id}, {"_id": 0})\
                            .sort("created_at", -1)\
                            .to_list(100)
    return docs

@api_router.get("/clients/{id}/payments")
async def get_client_payments(id: str, current_user: User = Depends(get_current_user)):
    docs = await db.transactions.find({
        "client_id": id, 
        "user_id": current_user.id, 
        "type": "credit",
        "invoice_id": {"$exists": True}
    }, {"_id": 0}).sort("date", -1).to_list(100)
    return docs

@api_router.get("/clients/{id}/activity")
async def get_client_activity(id: str, current_user: User = Depends(get_current_user)):
    # Activity related to client (either via resource_id or description keyword)
    docs = await db.audit_logs.find({
        "user_id": current_user.id,
        "$or": [
            {"resource_id": id},
            {"details": {"$regex": id}}
        ]
    }, {"_id": 0}).sort("timestamp", -1).limit(50).to_list(50)
    return docs

async def log_action(user_id: str, action: str, resource: str, details: str, resource_id: str = None):
    try:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            details=details
        )
        await db.audit_logs.insert_one(log_entry.model_dump())
    except Exception as e:
        import logging
        logging.error(f"Failed to log action: {e}")

class TransactionUpdate(BaseModel):
    account_id: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    category_id: Optional[str] = None
    ledger_name: Optional[str] = None
    group_name: Optional[str] = None
    reference_number: Optional[str] = None
    cheque_number: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[dict] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    business_name: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class CompanyProfile(BaseModel):
    user_id: Optional[str] = None
    company_name: str
    trade_name: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    cin: Optional[str] = None
    business_type: str
    registration_type: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    state_code: str
    pincode: str
    country: str = "India"
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    annual_turnover: Optional[float] = None
    fiscal_year_start: str = "April"
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch: Optional[str] = None
    logo_url: Optional[str] = None
    bank_balance: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Item(BaseModel):
    id: Optional[str] = None
    user_id: str
    name: str
    description: Optional[str] = None
    hsn_sac: str
    unit: str = "PCS" # PCS, BOX, MTR, KG, NOS, SAC (for services)
    item_type: str = "Goods" # Goods or Service
    tax_rate: float = 18.0 # Default 18%
    sale_price: float
    is_tax_inclusive: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH HELPERS ====================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if user is None:
        raise AuthError("User associated with this session no longer exists.")
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)


# ==================== SCHEDULE III REPORTS ====================

@api_router.get("/reports/pnl")
async def get_schedule_iii_pnl(
    date_from: str = None, 
    date_to: str = None, 
    current_user: User = Depends(get_current_user)
):
    """
    Statement of Profit and Loss (Schedule III)
    """
    query = {"user_id": current_user.id}
    if date_from and date_to:
        query["date"] = {"$gte": date_from, "$lte": date_to}
        
    transactions = await db.transactions.find(query).to_list(100000)
    
    # Revenue from Operations, Other Income
    income_categories = await db.categories.find({"user_id": current_user.id, "type": "income"}).to_list(1000)
    # Expenses (Employee Benefits, Finance costs, etc)
    expense_categories = await db.categories.find({"user_id": current_user.id, "type": "expense"}).to_list(1000)
    
    income_map = {str(c["_id"]): c for c in income_categories}
    expense_map = {str(c["_id"]): c for c in expense_categories}
    
    # Aggregation
    revenue_ops = 0
    other_income = 0
    
    cost_materials = 0
    employee_benefits = 0
    finance_costs = 0
    depreciation = 0
    other_expenses = 0
    
    for tx in transactions:
        amount = tx["amount"]
        cid = tx.get("category_id")
        
        if cid in income_map:
            head = income_map[cid].get("schedule_iii_head", "Other Income")
            if head == "Revenue from Operations": revenue_ops += amount
            else: other_income += amount
        elif cid in expense_map:
            head = expense_map[cid].get("schedule_iii_head", "Other Expenses")
            if head == "Employee Benefits": employee_benefits += amount
            elif head == "Finance Costs": finance_costs += amount
            elif head == "Depreciation": depreciation += amount
            elif head == "Cost of Materials": cost_materials += amount
            else: other_expenses += amount
            
    total_revenue = revenue_ops + other_income
    total_expenses = cost_materials + employee_benefits + finance_costs + depreciation + other_expenses
    profit_before_tax = total_revenue - total_expenses
    current_tax = profit_before_tax * 0.25 if profit_before_tax > 0 else 0 # Dummy 25% tax
    net_profit = profit_before_tax - current_tax
    
    return {
        "revenue": {
            "revenue_from_operations": revenue_ops,
            "other_income": other_income,
            "total_revenue": total_revenue
        },
        "expenses": {
            "cost_of_materials": cost_materials,
            "employee_benefit_expenses": employee_benefits,
            "finance_costs": finance_costs,
            "depreciation": depreciation,
            "other_expenses": other_expenses,
            "total_expenses": total_expenses
        },
        "profit_before_tax": profit_before_tax,
        "tax_expense": {
            "current_tax": current_tax,
            "deferred_tax": 0
        },
        "profit_for_period": net_profit
    }

@api_router.get("/reports/schedule-iii-balance-sheet")
async def get_schedule_iii_bs(
    as_of_date: str = None, 
    current_user: User = Depends(get_current_user)
):
    """
    Balance Sheet (Schedule III)
    """
    # Simply mapping existing logic to Schedule III heads
    accounts = await db.accounts.find({"user_id": current_user.id}).to_list(100)
    
    cash_equivalents = sum(a["balance"] for a in accounts if a["account_type"] in ["Bank", "Cash"])
    current_loans = sum(abs(a["balance"]) for a in accounts if a["account_type"] == "Card" and a["balance"] < 0)
    
    # Calculate Equity from all time P&L
    all_income = await db.transactions.find({"user_id": current_user.id, "type": "credit"}).to_list(100000)
    all_expense = await db.transactions.find({"user_id": current_user.id, "type": "debit"}).to_list(100000)
    
    total_inc = sum(t["amount"] for t in all_income)
    total_exp = sum(t["amount"] for t in all_expense)
    retained_earnings = total_inc - total_exp
    
    return {
        "equity_and_liabilities": {
            "shareholders_funds": {
                "share_capital": 500000, # Dummy initial capital
                "reserves_and_surplus": retained_earnings,
                "total": 500000 + retained_earnings
            },
            "non_current_liabilities": {
                "long_term_borrowings": 0,
                "total": 0
            },
            "current_liabilities": {
                "short_term_borrowings": current_loans,
                "trade_payables": 0,
                "total": current_loans
            },
            "total": 500000 + retained_earnings + current_loans
        },
        "assets": {
            "non_current_assets": {
                "fixed_assets": 0,
                "non_current_investments": 0,
                "total": 0
            },
            "current_assets": {
                "inventories": 0,
                "trade_receivables": 0,
                "cash_and_equivalents": cash_equivalents,
                "total": cash_equivalents
            },
            "total": cash_equivalents
        },
        "is_balanced": (500000 + retained_earnings + current_loans) == cash_equivalents
    }

# ==================== UTILITIES ====================

# Keywords for identifying transaction headers in bank statements
header_keywords = {
    "Date": ["date", "transaction date", "value date", "posting date"],
    "Particulars": ["particulars", "description", "narration", "remarks", "details", "transaction description"],
    "Amount": ["amount", "transaction amount", "txn amount", "total amount"],
    "Debit": ["debit", "withdrawal", "dr", "debit amount", "withdrawal amt", "dr amount"],
    "Credit": ["credit", "deposit", "cr", "credit amount", "deposit amt", "cr amount"],
    "Balance": ["balance", "closing balance", "running balance", "available balance"],
    "Group": ["group", "category", "transaction category", "category name"],
    "Ledger Name": ["ledger name", "ledger", "account", "account name"],
    "Account Holder Name": ["account holder name", "account holder", "customer name", "beneficiary name", "name"],
    "Cheque Number": ["cheque number", "cheque no", "chq no", "cheque #", "chq number"],
    "Reference": ["reference", "ref no", "reference no", "reference number", "chq/ref no"],
    "Notes": ["notes", "note", "remarks", "memo", "comment", "comments"],
    "Branch": ["branch", "branch name"]
}

def validate_gstin(gstin: str) -> dict:
    """
    GSTIN format: 22AAAAA0000A1Z5
    Position 1-2: State Code (01-38)
    Position 3-12: PAN of the entity
    Position 13: Entity number (1-9, A-Z)
    Position 14: 'Z' by default
    Position 15: Checksum digit/character
    """
    pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    if not re.match(pattern, gstin):
        return {"valid": False, "error": "Invalid GSTIN format"}
    
    state_code = gstin[:2]
    valid_state_codes = {
        "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
        "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
        "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
        "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
        "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
        "16": "Tripura", "17": "Meghalaya", "18": "Assam",
        "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
        "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
        "25": "Daman & Diu", "26": "Dadra & Nagar Haveli",
        "27": "Maharashtra", "28": "Andhra Pradesh (Old)",
        "29": "Karnataka", "30": "Goa", "31": "Lakshadweep",
        "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
        "35": "Andaman & Nicobar", "36": "Telangana",
        "37": "Andhra Pradesh", "38": "Ladakh"
    }
    
    if state_code not in valid_state_codes:
        return {"valid": False, "error": f"Invalid state code: {state_code}"}
    
    pan = gstin[2:12]
    state_name = valid_state_codes[state_code]
    
    return {"valid": True, "state_code": state_code, "state_name": state_name, "pan": pan}

def amount_to_words(num):
    """
    Converts a number to Indian currency format words.
    Example: 1234.56 -> One Thousand Two Hundred Thirty Four and Fifty Six Paisa Only
    """
    def get_words(n):
        units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", 
                 "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
        tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
        
        if n < 20: return units[int(n)]
        if n < 100: return tens[int(n // 10)] + ((" " + units[int(n % 10)]) if n % 10 != 0 else "")
        if n < 1000: return units[int(n // 100)] + " Hundred" + ((" and " + get_words(n % 100)) if n % 100 != 0 else "")
        if n < 100000: return get_words(n // 1000) + " Thousand" + ((" " + get_words(n % 1000)) if n % 1000 != 0 else "")
        if n < 10000000: return get_words(n // 100000) + " Lakh" + ((" " + get_words(n % 100000)) if n % 100000 != 0 else "")
        return get_words(n // 10000000) + " Crore" + ((" " + get_words(n % 10000000)) if n % 10000000 != 0 else "")

    if num == 0: return "Zero Rupees Only"
    
    parts = str(float(num)).split('.')
    rupees = int(parts[0])
    paisa = int(parts[1][:2]) if len(parts) > 1 else 0
    
    res = get_words(rupees) + " Rupees"
    if paisa > 0:
        res += " and " + get_words(paisa) + " Paisa"
    return res + " Only"

async def generate_invoice_number(user_id: str):
    """
    Generates sequential invoice number: VT/2024-25/0001
    """
    now = datetime.now(timezone.utc)
    # Fiscal year calculation (April to March)
    if now.month >= 4:
        fy = f"{now.year}-{str(now.year + 1)[2:]}"
    else:
        fy = f"{now.year - 1}-{str(now.year)[2:]}"
        
    config = await db.vitta_config.find_one({"user_id": user_id, "key": "invoice_counter"})
    if not config:
        counter = 1
        await db.vitta_config.insert_one({"user_id": user_id, "key": "invoice_counter", "value": counter, "fy": fy})
    else:
        # If fiscal year changed, reset counter
        if config.get("fy") != fy:
            counter = 1
            await db.vitta_config.update_one({"user_id": user_id, "key": "invoice_counter"}, {"$set": {"value": counter, "fy": fy}})
        else:
            counter = config["value"] + 1
            await db.vitta_config.update_one({"user_id": user_id, "key": "invoice_counter"}, {"$inc": {"value": 1}})
            
    return f"VT/{fy}/{str(counter).zfill(4)}"

def normalize_date(date_str):
    if not date_str or not isinstance(date_str, str):
        return date_str
    
    date_str = date_str.strip()
    # Try common formats
    formats = [
        "%d-%m-%Y", "%d/%m/%Y", "%d.%m.%Y",
        "%Y-%m-%d", "%Y/%m/%d", "%Y.%m.%d",
        "%d %b %Y", "%d %B %Y",
        "%b %d %Y", "%B %d %Y",
        "%m-%d-%Y", "%m/%d/%Y" # Less common in India but possible
    ]
    
    # Handle timestamp strings like "2024-03-14 00:00:00"
    if " " in date_str and ":" in date_str:
        date_part = date_str.split(" ")[0]
    else:
        date_part = date_str

    for fmt in formats:
        try:
            dt = datetime.strptime(date_part, fmt)
            return dt.strftime("%d-%m-%Y")
        except ValueError:
            continue
            
    return date_str # Return as is if no format works

# ==================== AUTH ROUTES ====================

@api_router.get("/")
async def api_root():
    return {"message": "Vitta API", "status": "running"}

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email
    )
    
    user_dict = user.model_dump()
    user_dict['password_hash'] = get_password_hash(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    try:
        await db.users.insert_one(user_dict)
    except Exception as e:
        logger.error(f"Failed to insert user: {e}")
        raise DatabaseError("Database insertion failed. Please contact support.")
    
    # Create default categories
    default_categories = [
        {"name": "Salary", "type": "income", "color": "#10B981"},
        {"name": "Sales", "type": "income", "color": "#3B82F6"},
        {"name": "Office Rent", "type": "expense", "color": "#EF4444"},
        {"name": "Utilities", "type": "expense", "color": "#F59E0B"},
        {"name": "Supplies", "type": "expense", "color": "#8B5CF6"},
        {"name": "Travel", "type": "expense", "color": "#EC4899"},
        {"name": "Food & Dining", "type": "expense", "color": "#F97316"},
        {"name": "Other", "type": "expense", "color": "#6B7280"},
    ]
    
    for cat in default_categories:
        category = Category(
            user_id=user.id,
            name=cat["name"],
            type=cat["type"],
            color=cat["color"]
        )
        cat_dict = category.model_dump()
        cat_dict['created_at'] = cat_dict['created_at'].isoformat()
        await db.categories.insert_one(cat_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    try:
        user_doc = await db.users.find_one({"email": user_data.email})
    except Exception as e:
        logger.error(f"Failed to fetch user during login: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Database connection failed. If you are using MongoDB Atlas, please ensure your IP is whitelisted."
        )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user_data.password, user_doc["password_hash"]):
        raise AuthError("The password you entered is incorrect.")
    
    user_doc.pop("_id", None)
    user_doc.pop("password_hash", None)
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(access_token=access_token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ==================== USER ROUTES ====================

@api_router.put("/user/profile", response_model=User)
async def update_profile(update_data: UserUpdate, current_user: User = Depends(get_current_user)):
    update_dict = update_data.model_dump(exclude_unset=True)
    if update_dict:
        await db.users.update_one({"id": current_user.id}, {"$set": update_dict})
    
    updated_user = await db.users.find_one({"id": current_user.id}, {"_id": 0, "password_hash": 0})
    if isinstance(updated_user.get('created_at'), str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    
    return User(**updated_user)

@api_router.put("/user/password")
async def update_password(password_data: PasswordUpdate, current_user: User = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user.id})
    
    if not verify_password(password_data.current_password, user_doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    new_hash = get_password_hash(password_data.new_password)
    await db.users.update_one({"id": current_user.id}, {"$set": {"password_hash": new_hash}})
    
    return {"message": "Password updated successfully"}

# ==================== COMPANY PROFILE ROUTES ====================

@api_router.get("/company-profile", response_model=Optional[CompanyProfile])
async def get_company_profile(current_user: User = Depends(get_current_user)):
    profile = await db.company_profiles.find_one({"user_id": current_user.id}, {"_id": 0})
    if not profile:
        return None
    
    # Handle datetime deserialization
    for field in ['created_at', 'updated_at']:
        if isinstance(profile.get(field), str):
            profile[field] = datetime.fromisoformat(profile[field])
            
    return CompanyProfile(**profile)

@api_router.post("/company-profile", response_model=CompanyProfile)
async def create_company_profile(profile_data: CompanyProfile, current_user: User = Depends(get_current_user)):
    profile_data.user_id = current_user.id
    
    # Check if profile already exists
    existing = await db.company_profiles.find_one({"user_id": current_user.id})
    if existing:
        raise HTTPException(status_code=400, detail="Company profile already exists. Use PUT to update.")
    
    profile_dict = profile_data.model_dump()
    profile_dict['created_at'] = profile_dict['created_at'].isoformat()
    profile_dict['updated_at'] = profile_dict['updated_at'].isoformat()
    
    await db.company_profiles.insert_one(profile_dict)
    await log_action(current_user.id, "create", "company_profile", f"Created company profile: {profile_data.company_name}")
    
    return profile_data

@api_router.put("/company-profile", response_model=CompanyProfile)
async def update_company_profile(profile_data: CompanyProfile, current_user: User = Depends(get_current_user)):
    profile_data.user_id = current_user.id
    profile_data.updated_at = datetime.now(timezone.utc)
    
    profile_dict = profile_data.model_dump()
    profile_dict['created_at'] = profile_dict['created_at'].isoformat() if isinstance(profile_dict['created_at'], datetime) else profile_dict['created_at']
    profile_dict['updated_at'] = profile_dict['updated_at'].isoformat()
    
    result = await db.company_profiles.update_one(
        {"user_id": current_user.id},
        {"$set": profile_dict},
        upsert=True
    )
    
    await log_action(current_user.id, "update", "company_profile", f"Updated company profile: {profile_data.company_name}")
    return profile_data

@api_router.get("/validate-gstin/{gstin}")
async def api_validate_gstin(gstin: str):
    return validate_gstin(gstin.upper())

# ==================== INVOICE ROUTES ====================

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(current_user: User = Depends(get_current_user)):
    cursor = db.invoices.find({"user_id": current_user.id})
    invoices = []
    async for doc in cursor:
        doc['id'] = str(doc['_id'])
        invoices.append(Invoice(**doc))
    return invoices

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice: Invoice, current_user: User = Depends(get_current_user)):
    invoice.user_id = current_user.id
    
    # Auto-generate invoice number if not provided
    if not invoice.invoice_number or invoice.invoice_number == "AUTO":
        invoice.invoice_number = await generate_invoice_number(current_user.id)
        
    # Get Company Profile for Tax Logic
    profile = await db.company_profiles.find_one({"user_id": current_user.id})
    if not profile and invoice.invoice_type == "Tax Invoice":
        raise HTTPException(status_code=400, detail="Company profile required for Tax Invoices. Complete Settings first.")
    
    my_state = profile.get("state") if profile else None
    
    # Recalculate Taxes and Totals Server-side for accuracy
    subtotal = 0
    cgst_total = 0
    sgst_total = 0
    igst_total = 0
    hsn_map = {} # hsn -> {taxable, cgst, sgst, igst, rate}
    
    for item in invoice.items:
        # Calculate taxable value: (Qty * Rate) - Discount
        base_value = item.quantity * item.rate
        item.taxable_value = base_value - (base_value * item.discount_percent / 100)
        
        # Determine Tax Type (CGST/SGST vs IGST)
        is_inter_state = invoice.place_of_supply != my_state
        
        if is_inter_state:
            item.igst_rate = item.tax_rate
            item.igst_amount = item.taxable_value * (item.igst_rate / 100)
            item.cgst_rate = 0
            item.cgst_amount = 0
            item.sgst_rate = 0
            item.sgst_amount = 0
        else:
            item.igst_rate = 0
            item.igst_amount = 0
            item.cgst_rate = item.tax_rate / 2
            item.cgst_amount = item.taxable_value * (item.cgst_rate / 100)
            item.sgst_rate = item.tax_rate / 2
            item.sgst_amount = item.taxable_value * (item.sgst_rate / 100)
            
        item.total_amount = item.taxable_value + item.cgst_amount + item.sgst_amount + item.igst_amount
        
        # Accumulate totals
        subtotal += item.taxable_value
        cgst_total += item.cgst_amount
        sgst_total += item.sgst_amount
        igst_total += item.igst_amount
        
        # Update HSN Summary
        hsn = item.hsn_sac
        if hsn not in hsn_map:
            hsn_map[hsn] = {"taxable": 0, "cgst": 0, "sgst": 0, "igst": 0, "rate": item.tax_rate}
        
        hsn_map[hsn]["taxable"] += item.taxable_value
        hsn_map[hsn]["cgst"] += item.cgst_amount
        hsn_map[hsn]["sgst"] += item.sgst_amount
        hsn_map[hsn]["igst"] += item.igst_amount

    # Build HSN Summary List
    invoice.hsn_summary = [
        HSNSummary(
            hsn_sac=h, 
            taxable_value=v["taxable"], 
            tax_rate=v["rate"],
            cgst_amount=v["cgst"],
            sgst_amount=v["sgst"],
            igst_amount=v["igst"],
            total_tax=v["cgst"] + v["sgst"] + v["igst"]
        ) for h, v in hsn_map.items()
    ]
    
    invoice.subtotal = subtotal
    invoice.cgst_total = cgst_total
    invoice.sgst_total = sgst_total
    invoice.igst_total = igst_total
    invoice.total_tax = cgst_total + sgst_total + igst_total
    
    total_raw = subtotal + invoice.total_tax
    invoice.grand_total = round(total_raw)
    invoice.round_off = invoice.grand_total - total_raw
    invoice.grand_total_words = amount_to_words(invoice.grand_total)
    
    invoice_dict = invoice.model_dump(exclude={"id"})
    invoice_dict['created_at'] = invoice_dict['created_at'].isoformat()
    invoice_dict['updated_at'] = invoice_dict['updated_at'].isoformat()
    
    result = await db.invoices.insert_one(invoice_dict)
    invoice.id = str(result.inserted_id)
    
    await log_action(current_user.id, "create", "invoice", f"Created invoice: {invoice.invoice_number}")
    return invoice

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, current_user: User = Depends(get_current_user)):
    doc = await db.invoices.find_one({"_id": ObjectId(invoice_id), "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    doc['id'] = str(doc['_id'])
    return Invoice(**doc)

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, current_user: User = Depends(get_current_user)):
    await db.invoices.delete_one({"_id": ObjectId(invoice_id), "user_id": current_user.id})
    await log_action(current_user.id, "delete", "invoice", f"Deleted invoice ID: {invoice_id}")
    return {"message": "Invoice deleted"}

@api_router.post("/invoices/{invoice_id}/einvoice")
async def generate_einvoice(invoice_id: str, current_user: User = Depends(get_current_user)):
    """
    Mock IRP (Invoice Registration Portal) Integration.
    In production, this would call NIC/ClearTax/Taxmann API.
    """
    invoice_doc = await db.invoices.find_one({"_id": ObjectId(invoice_id), "user_id": current_user.id})
    if not invoice_doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice_doc.get("irn"):
        return {"message": "E-Invoice already generated", "irn": invoice_doc["irn"]}
        
    # Validation
    if not invoice_doc.get("gstin_customer"):
        raise HTTPException(status_code=400, detail="Customer GSTIN required for E-Invoice")
        
    # Mocking IRN Generation (SHA-256 of SellerGSTIN + InvoiceNo + FY)
    import hashlib
    irn_base = f"{current_user.id}{invoice_doc['invoice_number']}2024-25"
    irn = hashlib.sha256(irn_base.encode()).hexdigest().upper()
    
    # Mock Signed QR Code (In reality, a JWT from NIC)
    signed_qr = f"MOCK_QR_{irn[:20]}"
    
    await db.invoices.update_one(
        {"_id": ObjectId(invoice_id)},
        {"$set": {
            "irn": irn,
            "signed_qr_code": signed_qr,
            "status": "E-Invoiced",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_action(current_user.id, "generate_einvoice", "invoice", f"IRN Generated for {invoice_doc['invoice_number']}")
    return {"message": "E-Invoice Generated", "irn": irn, "signed_qr_code": signed_qr}

# ==================== ITEM / PRODUCT ROUTES ====================

@api_router.get("/items", response_model=List[Item])
async def get_items(current_user: User = Depends(get_current_user)):
    cursor = db.items.find({"user_id": current_user.id})
    items = []
    async for doc in cursor:
        doc['id'] = str(doc['_id'])
        items.append(Item(**doc))
    return items

@api_router.post("/items", response_model=Item)
async def create_item(item: Item, current_user: User = Depends(get_current_user)):
    item.user_id = current_user.id
    item_dict = item.model_dump(exclude={"id"})
    
    # Handle dates
    item_dict['created_at'] = item_dict['created_at'].isoformat()
    item_dict['updated_at'] = item_dict['updated_at'].isoformat()
    
    result = await db.items.insert_one(item_dict)
    item.id = str(result.inserted_id)
    
    await log_action(current_user.id, "create", "item", f"Created item: {item.name}")
    return item

@api_router.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: str, item: Item, current_user: User = Depends(get_current_user)):
    item_dict = item.model_dump(exclude={"id", "user_id", "created_at"})
    item_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.items.update_one(
        {"_id": ObjectId(item_id), "user_id": current_user.id},
        {"$set": item_dict}
    )
    
    await log_action(current_user.id, "update", "item", f"Updated item: {item.name}")
    return item

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str, current_user: User = Depends(get_current_user)):
    await db.items.delete_one({"_id": ObjectId(item_id), "user_id": current_user.id})
    await log_action(current_user.id, "delete", "item", f"Deleted item ID: {item_id}")
    return {"message": "Item deleted"}

# ==================== BANK ACCOUNT ROUTES ====================

# ==================== BANK ACCOUNT ROUTES ====================

@api_router.post("/accounts", response_model=BankAccount)
async def create_account(account_data: BankAccountCreate, current_user: User = Depends(get_current_user)):
    # Verify client belongs to user
    client = await db.clients.find_one({"id": account_data.client_id, "user_id": current_user.id})
    if not client:
        raise NotFoundError("Client", account_data.client_id)

    account = BankAccount(
        user_id=current_user.id,
        balance=account_data.opening_balance,
        **account_data.model_dump()
    )
    
    account_dict = account.model_dump()
    account_dict['created_at'] = account_dict['created_at'].isoformat()
    
    await db.accounts.insert_one(account_dict)

    # Create special "opening" transaction
    opening_txn = Transaction(
        user_id=current_user.id,
        account_id=account.id,
        date=normalize_date(account_data.opening_balance_date),
        description="Opening Balance",
        amount=account_data.opening_balance,
        type="opening",
        notes="System generated opening balance"
    )
    opening_txn_dict = opening_txn.model_dump()
    opening_txn_dict['created_at'] = opening_txn_dict['created_at'].isoformat()
    await db.transactions.insert_one(opening_txn_dict)

    await log_action(current_user.id, "create", "account", f"Created account: {account.account_name} ({account.account_type})", account.id)

    return account

@api_router.get("/accounts", response_model=List[BankAccount])
async def get_accounts(current_user: User = Depends(get_current_user)):
    accounts = await db.accounts.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for acc in accounts:
        if isinstance(acc.get('created_at'), str):
            acc['created_at'] = datetime.fromisoformat(acc['created_at'])
    
    return accounts

@api_router.get("/accounts/summary")
async def get_accounts_summary(current_user: User = Depends(get_current_user)):
    # Aggregation to get inflow (credit) and outflow (debit) per account
    pipeline = [
        {"$match": {"user_id": current_user.id}},
        {
            "$group": {
                "_id": "$account_id",
                "inflow": {
                    "$sum": {
                        "$cond": [{"$eq": ["$type", "credit"]}, "$amount", 0]
                    }
                },
                "outflow": {
                    "$sum": {
                        "$cond": [{"$eq": ["$type", "debit"]}, "$amount", 0]
                    }
                }
            }
        }
    ]
    
    summary_results = await db.transactions.aggregate(pipeline).to_list(1000)
    summary_map = {item["_id"]: item for item in summary_results}
    
    accounts = await db.accounts.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for acc in accounts:
        acc_id = acc["id"]
        acc["inflow"] = summary_map.get(acc_id, {}).get("inflow", 0.0)
        acc["outflow"] = summary_map.get(acc_id, {}).get("outflow", 0.0)
        
        if isinstance(acc.get('created_at'), str):
            acc['created_at'] = datetime.fromisoformat(acc['created_at'])
    
    return {"accounts": accounts}

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str, current_user: User = Depends(get_current_user)):
    # Delete all transactions first
    await db.transactions.delete_many({"account_id": account_id, "user_id": current_user.id})
    result = await db.accounts.delete_one({"id": account_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    
    await log_action(current_user.id, "delete", "account", f"Deleted account ID: {account_id}", account_id)
    return {"message": "Account deleted successfully"}

@api_router.put("/accounts/{account_id}")
async def update_account(account_id: str, account_data: BankAccountUpdate, current_user: User = Depends(get_current_user)):
    existing_account = await db.accounts.find_one({"id": account_id, "user_id": current_user.id})
    if not existing_account:
        raise HTTPException(status_code=404, detail="Account not found")

    update_dict = account_data.model_dump(exclude_unset=True)
    if not update_dict:
        return {"message": "No changes to update"}
    
    # Handle opening balance update
    if "opening_balance" in update_dict or "opening_balance_date" in update_dict:
        new_ob = update_dict.get("opening_balance", existing_account["opening_balance"])
        new_ob_date = normalize_date(update_dict.get("opening_balance_date", existing_account["opening_balance_date"]))
        
        # Calculate balance adjustment
        ob_diff = new_ob - existing_account["opening_balance"]
        if ob_diff != 0:
            update_dict["balance"] = existing_account["balance"] + ob_diff
            
        # Update/Create opening transaction
        await db.transactions.update_one(
            {"account_id": account_id, "type": "opening"},
            {"$set": {
                "amount": new_ob,
                "date": new_ob_date
            }},
            upsert=True # In case it was missing
        )

    result = await db.accounts.update_one(
        {"id": account_id, "user_id": current_user.id},
        {"$set": update_dict}
    )
    
    await log_action(current_user.id, "update", "account", f"Updated account: {existing_account['account_name']}", account_id)
    return {"message": "Account updated successfully"}

# ==================== CLIENT ROUTES ====================

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    client = Client(
        user_id=current_user.id,
        **client_data.model_dump()
    )
    client_dict = client.model_dump()
    client_dict['created_at'] = client_dict['created_at'].isoformat()
    await db.clients.insert_one(client_dict)
    
    await log_action(current_user.id, "create", "client", f"Created client: {client.name}", client.id)
    return client

@api_router.get("/clients", response_model=List[Client])
async def get_clients(current_user: User = Depends(get_current_user)):
    clients = await db.clients.find({"user_id": current_user.id}).to_list(1000)
    for c in clients:
        c.pop("_id", None)
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user: User = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id, "user_id": current_user.id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if isinstance(client.get('created_at'), str):
        client['created_at'] = datetime.fromisoformat(client['created_at'])
    return client

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: User = Depends(get_current_user)):
    # Also delete child accounts and transactions? 
    # For now, just delete the client
    result = await db.clients.delete_one({"id": client_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    await log_action(current_user.id, "delete", "client", f"Deleted client ID: {client_id}", client_id)
    return {"message": "Client deleted successfully"}

# ==================== CATEGORY ROUTES ====================

@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryCreate, current_user: User = Depends(get_current_user)):
    category = Category(
        user_id=current_user.id,
        name=category_data.name,
        type=category_data.type,
        color=category_data.color
    )
    
    category_dict = category.model_dump()
    category_dict['created_at'] = category_dict['created_at'].isoformat()
    
    await db.categories.insert_one(category_dict)
    
    await log_action(current_user.id, "create", "category", f"Created group: {category.name}", category.id)
    return category

@api_router.get("/categories", response_model=List[Category])
async def get_categories(current_user: User = Depends(get_current_user)):
    categories = await db.categories.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for cat in categories:
        if isinstance(cat.get('created_at'), str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    
    return categories

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: User = Depends(get_current_user)):
    result = await db.categories.delete_one({"id": category_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
    
    await log_action(current_user.id, "delete", "category", f"Deleted group ID: {category_id}", category_id)
    return {"message": "Group deleted successfully"}

# ==================== TRANSACTION ROUTES ====================

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate, current_user: User = Depends(get_current_user)):
    # Verify account belongs to user
    account_doc = await db.accounts.find_one({"id": transaction_data.account_id, "user_id": current_user.id})
    if not account_doc:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # --- PHASE 2.6: Automation Rules ---
    # Auto-categorize if category is not provided
    if not transaction_data.category_id:
        rules = await db.automation_rules.find({"user_id": current_user.id, "is_active": True}).to_list(100)
        desc_lower = transaction_data.description.lower()
        for rule in rules:
            if rule['keyword'].lower() in desc_lower:
                transaction_data.category_id = rule['category_id']
                break

    transaction = Transaction(
        user_id=current_user.id,
        **transaction_data.model_dump()
    )
    
    if transaction.date:
        transaction.date = normalize_date(transaction.date)
    
    transaction_dict = transaction.model_dump()
    transaction_dict['created_at'] = transaction_dict['created_at'].isoformat()
    
    await db.transactions.insert_one(transaction_dict)
    
    # Update account balance
    balance_inc = transaction_data.amount if transaction.type == "credit" else -transaction_data.amount
    await db.accounts.update_one(
        {"id": transaction_data.account_id},
        {"$inc": {"balance": balance_inc}}
    )
    
    # --- PHASE 2.5: Audit Logging ---
    await log_action(
        current_user.id, "create", "transaction", 
        f"Created {transaction.type} transaction: {transaction.description} for ₹{transaction.amount}",
        transaction.id
    )
    
    return transaction

@api_router.get("/transactions")
async def get_transactions(
    account_id: Optional[str] = None,
    category_id: Optional[str] = None,
    type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    reference: Optional[str] = None,
    page: int = 1,
    page_size: str = "50",
    current_user: User = Depends(get_current_user)
):
    query = {"user_id": current_user.id}
    
    if account_id:
        query["account_id"] = account_id
    if category_id:
        query["category_id"] = category_id
    if type:
        query["type"] = type
    
    # Base fetch
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(10000)
    
    # In-memory sorting and filtering because of DD-MM-YYYY string format
    def get_date_obj(date_str):
        try:
            return datetime.strptime(date_str, '%d-%m-%Y')
        except:
            return datetime.min

    # Sort ASC first: Date then Type ('opening' vs others)
    # Since 'opening' > 'credit'/'debit', and opening应该是最早的, we sort by date asc.
    # We want 'opening' to be the absolute first transaction of that account.
    transactions.sort(key=lambda x: (get_date_obj(x['date']), 0 if x['type'] == 'opening' else 1))

    # Apply date filters in memory if provided
    if date_from:
        df_obj = get_date_obj(normalize_date(date_from))
        transactions = [t for t in transactions if get_date_obj(t['date']) >= df_obj]
    if date_to:
        dt_obj = get_date_obj(normalize_date(date_to))
        transactions = [t for t in transactions if get_date_obj(t['date']) <= dt_obj]
    if reference:
        ref_lower = reference.lower()
        transactions = [t for t in transactions if 
                        (t.get('reference_number') and ref_lower in t['reference_number'].lower()) or 
                        (t.get('cheque_number') and ref_lower in t['cheque_number'].lower())]

    for txn in transactions:
        if isinstance(txn.get('created_at'), str):
            txn['created_at'] = datetime.fromisoformat(txn['created_at'])
    
    total = len(transactions)
    
    # Handle pagination
    if page_size != "all":
        try:
            ps = int(page_size)
            start_idx = (page - 1) * ps
            end_idx = page * ps
            
            # Since transactions are ASC, we calculate sum before start_idx
            starting_balance = 0
            for i in range(min(start_idx, total)):
                txn = transactions[i]
                if txn['type'] in ['credit', 'opening']:
                    starting_balance += txn['amount']
                else:
                    starting_balance -= txn['amount']
            
            paged_transactions = transactions[start_idx:min(end_idx, total)]
            
            return {
                "transactions": paged_transactions[::-1],
                "total": total,
                "page": page,
                "page_size": ps,
                "total_pages": (total + ps - 1) // ps,
                "starting_balance": starting_balance
            }
        except ValueError:
            pass

    return {
        "transactions": transactions[::-1],
        "total": total,
        "page": 1,
        "page_size": total,
        "total_pages": 1,
        "starting_balance": 0
    }

@api_router.get("/transactions/count")
async def get_transactions_count(
    account_id: Optional[str] = None,
    category_id: Optional[str] = None,
    type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    reference: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {"user_id": current_user.id}
    if account_id: query["account_id"] = account_id
    if category_id: query["category_id"] = category_id
    if type: query["type"] = type
    
    # Since date filtering and reference filtering are currently in-memory (due to DD-MM-YYYY format),
    # we have to fetch all and filter in memory if those filters are provided.
    # Otherwise, we can use db.count_documents.
    
    if not (date_from or date_to or reference):
        count = await db.transactions.count_documents(query)
        return {"total": count}
    
    # If complex filters are used, we follow the same logic as get_transactions
    transactions = await db.transactions.find(query, {"id": 1, "date": 1, "reference_number": 1, "cheque_number": 1}).to_list(10000)
    
    def get_date_obj(date_str):
        try: return datetime.strptime(date_str, '%d-%m-%Y')
        except: return datetime.min

    if date_from:
        df_obj = get_date_obj(normalize_date(date_from))
        transactions = [t for t in transactions if get_date_obj(t['date']) >= df_obj]
    if date_to:
        dt_obj = get_date_obj(normalize_date(date_to))
        transactions = [t for t in transactions if get_date_obj(t['date']) <= dt_obj]
    if reference:
        ref_lower = reference.lower()
        transactions = [t for t in transactions if 
                        (t.get('reference_number') and ref_lower in t['reference_number'].lower()) or 
                        (t.get('cheque_number') and ref_lower in t['cheque_number'].lower())]
    
    return {"total": len(transactions)}

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(
    transaction_id: str,
    update_data: TransactionUpdate,
    current_user: User = Depends(get_current_user)
):
    # Get existing transaction
    existing_txn = await db.transactions.find_one({"id": transaction_id, "user_id": current_user.id})
    if not existing_txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    # Handle balance change if amount or type or account_id changes
    if "amount" in update_dict or "type" in update_dict or "account_id" in update_dict:
        old_amount = existing_txn["amount"]
        old_type = existing_txn["type"]
        old_account_id = existing_txn["account_id"]
        
        new_amount = update_dict.get("amount", old_amount)
        new_type = update_dict.get("type", old_type)
        new_account_id = update_dict.get("account_id", old_account_id)
        
        # 1. Reverse old impact from old account
        old_inc = -old_amount if old_type == "credit" else old_amount
        await db.accounts.update_one({"id": old_account_id}, {"$inc": {"balance": old_inc}})
        
        # 2. Apply new impact to new account
        new_inc = new_amount if new_type == "credit" else -new_amount
        await db.accounts.update_one({"id": new_account_id}, {"$inc": {"balance": new_inc}})

    if "date" in update_dict:
        update_dict["date"] = normalize_date(update_dict["date"])

    await db.transactions.update_one(
        {"id": transaction_id, "user_id": current_user.id},
        {"$set": update_dict}
    )
    
    await log_action(current_user.id, "update", "transaction", f"Updated transaction: {existing_txn['description']}", transaction_id)
    
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if isinstance(transaction.get('created_at'), str):
        transaction['created_at'] = datetime.fromisoformat(transaction['created_at'])
    
    return Transaction(**transaction)

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user: User = Depends(get_current_user)):
    # Get transaction first to update balance
    transaction = await db.transactions.find_one({"id": transaction_id, "user_id": current_user.id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction.get("type") == "opening":
        raise HTTPException(status_code=400, detail="Opening balance transaction cannot be deleted directly. Update it in Account settings.")

    # Reverse balance update
    if transaction["type"] == "credit":
        await db.accounts.update_one(
            {"id": transaction["account_id"]},
            {"$inc": {"balance": -transaction["amount"]}}
        )
    elif transaction["type"] == "debit":
        await db.accounts.update_one(
            {"id": transaction["account_id"]},
            {"$inc": {"balance": transaction["amount"]}}
        )
    
    await db.transactions.delete_one({"id": transaction_id})
    await log_action(current_user.id, "delete", "transaction", f"Deleted transaction: {transaction['description']}", transaction_id)
    return {"message": "Transaction deleted successfully"}

@api_router.post("/transactions/bulk-delete")
async def bulk_delete_transactions(payload: dict, current_user: User = Depends(get_current_user)):
    transaction_ids = payload.get("transaction_ids", [])
    if not transaction_ids:
        raise HTTPException(status_code=400, detail="No transaction IDs provided")
    
    # Fetch transactions to update balances
    cursor = db.transactions.find({"id": {"$in": transaction_ids}, "user_id": current_user.id})
    transactions = await cursor.to_list(len(transaction_ids))
    
    # Filter out opening balance transactions if any
    transactions_to_delete = [t for t in transactions if t.get("type") != "opening"]
    ids_to_delete = [t["id"] for t in transactions_to_delete]
    
    if not ids_to_delete:
        return {"message": "No deletable transactions selected (Opening balances cannot be bulk deleted)"}
    
    # Reverse balance impact for each
    for txn in transactions_to_delete:
        inc = -txn["amount"] if txn["type"] == "credit" else txn["amount"]
        await db.accounts.update_one({"id": txn["account_id"]}, {"$inc": {"balance": inc}})
    
    await db.transactions.delete_many({"id": {"$in": ids_to_delete}})
    
    await log_action(current_user.id, "delete", "transaction", f"Bulk deleted {len(ids_to_delete)} transactions", None)
    return {"message": f"Successfully deleted {len(ids_to_delete)} transactions"}

@api_router.post("/transactions/bulk-update-category")
async def bulk_update_category(payload: dict, current_user: User = Depends(get_current_user)):
    transaction_ids = payload.get("transaction_ids", [])
    category_id = payload.get("category_id")
    
    if not transaction_ids or not category_id:
        raise HTTPException(status_code=400, detail="Transaction IDs and Category ID are required")
    
    await db.transactions.update_many(
        {"id": {"$in": transaction_ids}, "user_id": current_user.id},
        {"$set": {"category_id": category_id}}
    )
    
    await log_action(current_user.id, "update", "transaction", f"Bulk updated category for {len(transaction_ids)} transactions", None)
    return {"message": f"Successfully updated category for {len(transaction_ids)} transactions"}

@api_router.get("/search")
async def global_search(q: str, current_user: User = Depends(get_current_user)):
    if not q or len(q) < 2:
        return {"results": []}
    
    regex_query = {"$regex": q, "$options": "i"}
    limit = 10
    
    results = []
    
    # 1. Search Transactions
    transactions = await db.transactions.find({
        "user_id": current_user.id,
        "$or": [
            {"description": regex_query},
            {"ledger_name": regex_query},
            {"notes": regex_query},
            {"reference_number": regex_query},
            {"cheque_number": regex_query}
        ]
    }, {"_id": 0}).limit(limit).to_list(limit)
    
    for t in transactions:
        results.append({
            "type": "transaction",
            "title": t["description"],
            "subtitle": f"{t['date']} · {t['type'].capitalize()} · ₹{t['amount']}",
            "id": t["id"],
            "data": t
        })
        
    # 2. Search Clients
    clients = await db.clients.find({
        "user_id": current_user.id,
        "$or": [
            {"name": regex_query},
            {"business_type": regex_query},
            {"notes": regex_query}
        ]
    }, {"_id": 0}).limit(limit).to_list(limit)
    
    for c in clients:
        results.append({
            "type": "client",
            "title": c["name"],
            "subtitle": f"{c['business_type'] or 'Client'} · {c['country']}",
            "id": c["id"],
            "data": c
        })
        
    # 3. Search Accounts
    accounts = await db.accounts.find({
        "user_id": current_user.id,
        "$or": [
            {"account_name": regex_query},
            {"bank_name": regex_query},
            {"account_number": regex_query}
        ]
    }, {"_id": 0}).limit(limit).to_list(limit)
    
    for a in accounts:
        results.append({
            "type": "account",
            "title": a["account_name"],
            "subtitle": f"{a['account_type']} · {a['bank_name'] or ''}",
            "id": a["id"],
            "data": a
        })
        
    # 4. Search Categories
    categories = await db.categories.find({
        "user_id": current_user.id,
        "name": regex_query
    }, {"_id": 0}).limit(limit).to_list(limit)
    
    for cat in categories:
        results.append({
            "type": "category",
            "title": cat["name"],
            "subtitle": f"{cat['type'].capitalize()} Group",
            "id": cat["id"],
            "data": cat
        })
        
    return {"results": results}

# ─────────────────────────────────────────────────────────────────────────────
# ══ INVOICES ══
# ─────────────────────────────────────────────────────────────────────────────

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(data: InvoiceCreate, current_user: User = Depends(get_current_user)):
    # 1. Validation
    client = await db.clients.find_one({"id": data.client_id, "user_id": current_user.id})
    if not client: raise HTTPException(status_code=404, detail="Client not found")
    
    # 2. Sequence Generation
    year = "2024-25" # Mock fiscal year
    last_inv = await db.invoices.find({"user_id": current_user.id}).sort("created_at", -1).limit(1).to_list(1)
    seq = 1
    if last_inv:
        try:
            parts = last_inv[0]['invoice_number'].split('/')
            seq = int(parts[-1]) + 1
        except: seq = 1
    inv_num = f"VITTA/{year}/{seq:04d}"

    # 3. Create Entity
    invoice = Invoice(
        user_id=current_user.id,
        client_id=data.client_id,
        invoice_number=inv_num,
        invoice_date=data.invoice_date,
        due_date=data.due_date,
        place_of_supply=data.place_of_supply,
        billing_address=data.billing_address,
        shipping_address=data.shipping_address,
        gstin_customer=data.gstin_customer,
        items=data.items,
        hsn_summary=data.hsn_summary,
        subtotal=data.subtotal,
        total_tax=data.total_tax,
        cgst_total=data.cgst_total,
        sgst_total=data.sgst_total,
        igst_total=data.igst_total,
        round_off=data.round_off,
        grand_total=data.grand_total,
        grand_total_words=data.grand_total_words,
        status=data.status,
        notes=data.notes,
        terms=data.terms,
        currency=data.currency
    )

    inv_dict = invoice.model_dump()
    inv_dict['created_at'] = inv_dict['created_at'].isoformat()
    inv_dict['updated_at'] = inv_dict['updated_at'].isoformat()
    await db.invoices.insert_one(inv_dict)
    
    await log_action(current_user.id, "create", "invoice", f"Created invoice {invoice.invoice_number} for {total}", invoice.id)
    return invoice

@api_router.get("/invoices")
async def get_invoices(
    status: Optional[str] = None, 
    client_id: Optional[str] = None, 
    page: int = 1,
    limit: int = 15,
    current_user: User = Depends(get_current_user)
):
    query = {"user_id": current_user.id}
    if status: query["status"] = status
    if client_id: query["client_id"] = client_id
    
    skip = (page - 1) * limit
    total_count = await db.invoices.count_documents(query)
    
    # Corrected projection logic to return list of Invoice objects
    docs = await db.invoices.find(query, {"_id": 0})\
                           .sort("created_at", -1)\
                           .skip(skip)\
                           .limit(limit)\
                           .to_list(limit)
    today = datetime.now().date()
    
    for doc in docs:
        if isinstance(doc.get('created_at'), str):
            doc['created_at'] = datetime.fromisoformat(doc['created_at'])
        
        # Overdue logic on the fly
        if doc['status'] == 'sent' or doc['status'] == 'draft':
            try:
                due = datetime.strptime(doc['due_date'], "%d-%m-%Y").date()
                if due < today:
                    doc['status'] = 'overdue'
            except: pass
            
    return {
        "invoices": docs,
        "total": total_count,
        "page": page,
        "limit": limit
    }

@api_router.get("/invoices/summary")
async def get_invoice_summary(current_user: User = Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": current_user.id, "status": {"$ne": "cancelled"}}},
        {"$group": {
            "_id": None,
            "total_invoiced": {"$sum": "$total"},
            "total_paid": {"$sum": "$amount_paid"},
            "total_outstanding": {"$sum": "$balance_due"}
        }}
    ]
    res = await db.invoices.aggregate(pipeline).to_list(1)
    
    summary = res[0] if res else {"total_invoiced": 0, "total_paid": 0, "total_outstanding": 0}
    summary.pop("_id", None)
    
    # Overdue count
    today_str = datetime.now().strftime("%d-%m-%Y")
    # This is rough as string compare, but better to fetch and filter for accuracy
    invoices = await db.invoices.find({"user_id": current_user.id, "status": {"$in": ["sent", "draft"]}}).to_list(1000)
    overdue_amt = 0
    today = datetime.now().date()
    for inv in invoices:
        try:
            due = datetime.strptime(inv['due_date'], "%d-%m-%Y").date()
            if due < today: overdue_amt += inv['balance_due']
        except: pass
        
    summary["total_overdue"] = overdue_amt
    return summary

@api_router.get("/invoices/{id}")
async def get_invoice(id: str, current_user: User = Depends(get_current_user)):
    doc = await db.invoices.find_one({"id": id, "user_id": current_user.id}, {"_id": 0})
    if not doc: raise HTTPException(status_code=404, detail="Invoice not found")
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    return doc

@api_router.post("/invoices/{id}/record-payment")
async def record_payment(id: str, data: dict, current_user: User = Depends(get_current_user)):
    amount = data.get("amount", 0)
    invoice = await db.invoices.find_one({"id": id, "user_id": current_user.id})
    if not invoice: raise HTTPException(status_code=404, detail="Invoice not found")

    new_paid = invoice['amount_paid'] + amount
    new_balance = invoice['total'] - new_paid
    new_status = "paid" if new_balance <= 0 else invoice['status']
    
    await db.invoices.update_one(
        {"id": id}, 
        {"$set": {
            "amount_paid": new_paid, 
            "balance_due": max(0, new_balance),
            "status": new_status,
            "paid_at": datetime.now(timezone.utc).isoformat() if new_balance <= 0 else None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    # ══ AUTO-LEDGER SYNC ══
    # Fetch invoice again to get client/account info
    invoice_full = await db.invoices.find_one({"id": id})
    client = await db.clients.find_one({"id": invoice_full['client_id']})
    
    from uuid import uuid4
    payment_method = data.get("payment_method", "Bank Transfer")
    account_id = data.get("account_id") or invoice_full.get('account_id')
    
    if not account_id:
        # Fallback to first available bank account if none linked
        acc = await db.accounts.find_one({"user_id": current_user.id})
        account_id = acc['id'] if acc else "CASH"

    payment_txn = {
        "id": str(uuid4()),
        "user_id": current_user.id,
        "account_id": account_id,
        "invoice_id": id,
        "client_id": invoice_full['client_id'],
        "date": datetime.now().strftime("%d-%m-%Y"),
        "description": f"Payment Recv: {invoice_full['invoice_number']} - {client['name'] if client else 'Unknown'}",
        "amount": amount,
        "type": "credit",
        "category_id": "REVENUE-SALES", # Default sales revenue category
        "payment_method": payment_method,
        "notes": f"Recorded via Invoice detail. Method: {payment_method}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(payment_txn)
    await db.accounts.update_one({"id": account_id}, {"$inc": {"balance": amount}})
    
    await log_action(
        current_user.id, "payment", "invoice", 
        f"Payment of ₹{amount} received via {payment_method} for {invoice_full['invoice_number']}", 
        id
    )
    
    return {"status": "success", "balance_due": max(0, new_balance), "status_label": new_status}

@api_router.post("/invoices/{id}/send")
async def send_invoice(id: str, current_user: User = Depends(get_current_user)):
    await db.invoices.update_one(
        {"id": id, "user_id": current_user.id},
        {"$set": {"status": "sent", "sent_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "sent"}

@api_router.delete("/invoices/{id}")
async def delete_invoice(id: str, current_user: User = Depends(get_current_user)):
    # Only drafts can be deleted to maintain audit trail
    invoice = await db.invoices.find_one({"id": id, "user_id": current_user.id})
    if not invoice: raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice['status'] != 'draft':
        raise HTTPException(status_code=400, detail="Only draft invoices can be deleted")
    
    await db.invoices.delete_one({"id": id})
    await log_action(current_user.id, "delete", "invoice", f"Deleted invoice ID: {id}", id)
    return {"status": "deleted"}

# ==================== CSV IMPORT ROUTES ====================

@api_router.post("/import/csv")
async def import_csv(
    file: UploadFile = File(...),
    account_id: str = None,
    force_balance: bool = False,
    current_user: User = Depends(get_current_user)
):
    if not file.filename.lower().endswith(('.csv', '.pdf', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only CSV, Excel, and PDF files are supported")
    
    if not account_id:
        raise HTTPException(status_code=400, detail="Account ID is required")
    
    # Verify account belongs to user
    account = await db.accounts.find_one({"id": account_id, "user_id": current_user.id})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    try:
        contents = await file.read()
        
        # Handle PDF files
        if file.filename.endswith('.pdf'):
            try:
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                
                logging.info(f"Extracted text from PDF (first 500 chars): {text[:500]}")
                
                # Parse text to extract transactions
                lines = text.split('\n')
                transactions_data = []
                
                # Try multiple date patterns
                date_patterns = [
                    r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})',  # DD-MM-YYYY or DD/MM/YYYY
                    r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',  # YYYY-MM-DD
                    r'(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})',  # DD Mon YYYY
                ]
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Try each date pattern
                    date_match = None
                    for pattern in date_patterns:
                        date_match = re.search(pattern, line)
                        if date_match:
                            break
                    
                    if date_match:
                        date_str = date_match.group(1)
                        
                        # Extract all numbers (potential amounts) - more flexible pattern
                        # Matches: 1,00,000.00 or 100000.00 or 1000.00 or 1,000
                        amounts = re.findall(r'(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)', line)
                        
                        # Filter out dates from amounts
                        amounts = [amt for amt in amounts if not re.match(r'^\d{1,2}$', amt) and amt != date_str]
                        
                        if amounts:
                            # Get description (text between date and first amount)
                            desc_start = line.find(date_str) + len(date_str)
                            first_amount_pos = line.find(amounts[0])
                            description = line[desc_start:first_amount_pos].strip()
                            
                            # Clean description - remove extra spaces and special chars
                            description = ' '.join(description.split())
                            
                            if description and len(description) > 2:
                                # Look for the last 2-3 amounts (likely debit, credit, balance)
                                # Skip balance (last amount) and use previous ones
                                relevant_amounts = amounts[:-1] if len(amounts) > 2 else amounts
                                
                                dr_amount = ''
                                cr_amount = ''
                                
                                if len(relevant_amounts) >= 2:
                                    # Has both debit and credit
                                    dr_amount = relevant_amounts[0] if relevant_amounts[0] not in ['0', '0.00', '0.0'] else ''
                                    cr_amount = relevant_amounts[1] if relevant_amounts[1] not in ['0', '0.00', '0.0'] else ''
                                elif len(relevant_amounts) == 1:
                                    # Single amount - assume debit for now
                                    dr_amount = relevant_amounts[0]
                                
                                if dr_amount or cr_amount:
                                    balance_val = amounts[-1] if len(amounts) > 2 else None
                                    transactions_data.append({
                                        'Txn Date': normalize_date(date_str),
                                        'Description': description,
                                        'Dr Amount': dr_amount,
                                        'Cr Amount': cr_amount,
                                        'Balance': balance_val
                                    })
                                    logging.debug(f"Found transaction: {date_str} | {description} | Dr:{dr_amount} | Cr:{cr_amount}")
                
                logging.info(f"Total transactions found: {len(transactions_data)}")
                
                if not transactions_data:
                    # Log some sample lines for debugging
                    valid_lines: List[str] = [l for l in lines if l.strip()]
                    sample_lines = [valid_lines[i] for i in range(min(10, len(valid_lines)))]
                    logging.error(f"No transactions found. Sample lines: {sample_lines}")
                    raise HTTPException(status_code=400, detail="No transactions found in PDF. Please ensure it's a text-based PDF with transaction table. Try uploading a CSV file instead.")
                
                # Convert to DataFrame
                df = pd.DataFrame(transactions_data)
                logging.info(f"Successfully extracted {len(df)} transactions from PDF")
                
            except HTTPException:
                raise
            except Exception as e:
                logging.error(f"Error parsing PDF: {e}")
                raise HTTPException(status_code=400, detail=f"Error parsing PDF: {str(e)}")
        elif file.filename.lower().endswith(('.xlsx', '.xls')):
            # Handle Excel files
            df = pd.read_excel(io.BytesIO(contents))
        else:
            # Handle CSV files
            try:
                # Try UTF-8 first
                df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
            except UnicodeDecodeError:
                # Fallback to latin-1
                df = pd.read_csv(io.StringIO(contents.decode('latin-1')))
        
        # Expected columns: Date, Description, Debit, Credit
        # Flexible column matching
        date_col = None
        desc_col = None
        debit_col = None
        credit_col = None
        balance_col = None
        group_col = None
        ledger_col = None
        account_holder_col = None
        ref_col = None
        cheque_col = None
        notes_col = None
        
        for col in df.columns:
            col_lower = col.lower().strip()
            
            # Use header_keywords for robust matching
            if any(k in col_lower for k in header_keywords["Date"]):
                date_col = col
            elif any(k in col_lower for k in header_keywords["Particulars"]):
                desc_col = col
            elif any(k in col_lower for k in header_keywords["Debit"]):
                debit_col = col
            elif any(k in col_lower for k in header_keywords["Credit"]):
                credit_col = col
            elif any(k in col_lower for k in header_keywords["Balance"]):
                balance_col = col
            elif any(k in col_lower for k in header_keywords["Group"]):
                group_col = col
            elif any(k in col_lower for k in header_keywords["Ledger Name"]):
                ledger_col = col
            elif any(k in col_lower for k in header_keywords["Account Holder Name"]):
                account_holder_col = col
            elif any(k in col_lower for k in header_keywords["Reference"]):
                ref_col = col
            elif any(k in col_lower for k in header_keywords["Cheque Number"]):
                cheque_col = col
            elif any(k in col_lower for k in header_keywords["Notes"]):
                notes_col = col
        
        if not date_col:
            raise HTTPException(status_code=400, detail=f"CSV must have a Date column. Found columns: {list(df.columns)}")
        if not desc_col:
            raise HTTPException(status_code=400, detail=f"CSV must have a Particulars column. Found columns: {list(df.columns)}")

        
        imported_count = 0
        categories = await db.categories.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
        
        # Log detected columns for debugging
        logging.info(f"Detected columns - Date: {date_col}, Desc: {desc_col}, Debit: {debit_col}, Credit: {credit_col}, Balance: {balance_col}")
        
        # Balance Verification Logic
        if balance_col and not force_balance and not df.empty:
            provided_final = float(df.iloc[-1][balance_col])
            
            # Calculate expected delta
            delta = 0
            for _, row in df.iterrows():
                row_debit = float(row[debit_col]) if debit_col and pd.notnull(row[debit_col]) else 0
                row_credit = float(row[credit_col]) if credit_col and pd.notnull(row[credit_col]) else 0
                delta += (row_credit - row_debit)
            
            expected_final = float(account['balance']) + delta
            if abs(expected_final - provided_final) > 0.01:
                return JSONResponse(
                    status_code=409,
                    content={
                        "detail": "Balance Mismatch detected in import statement",
                        "calculated": expected_final,
                        "provided": provided_final
                    }
                )
        
        for _, row in df.iterrows():
            try:
                date_str = str(row[date_col]).strip()
                description = str(row[desc_col]).strip()
                
                debit = 0
                credit = 0
                
                if debit_col and pd.notna(row.get(debit_col)):
                    debit_val = str(row[debit_col]).strip().replace(',', '')
                    if debit_val and debit_val != '':
                        try:
                            debit = float(debit_val)
                        except:
                            logging.warning(f"Could not parse debit value: {debit_val}")
                
                if credit_col and pd.notna(row.get(credit_col)):
                    credit_val = str(row[credit_col]).strip().replace(',', '')
                    if credit_val and credit_val != '':
                        try:
                            credit = float(credit_val)
                        except:
                            logging.warning(f"Could not parse credit value: {credit_val}")
                
                if debit == 0 and credit == 0:
                    logging.debug(f"Skipping row - both debit and credit are 0: {description}")
                    continue
                
                # Auto-categorize based on Group column if available, else keywords
                category_id = None
                
                # Fetch automation rules before the loop for efficiency
                if 'automation_rules' not in locals():
                    automation_rules = await db.automation_rules.find({"user_id": current_user.id, "is_active": True}).to_list(100)

                if group_col and pd.notna(row.get(group_col)):
                    group_val = str(row[group_col]).lower().strip()
                    for cat in categories:
                        if cat['name'].lower() == group_val:
                            category_id = cat['id']
                            break
                            
                if not category_id:
                    desc_lower = description.lower()
                    for rule in automation_rules:
                        if rule['keyword'].lower() in desc_lower:
                            category_id = rule['category_id']
                            break
                
                # Fallback to simple hardcoded match if still no category (legacy support)
                if not category_id:
                    desc_lower = description.lower()
                    for cat in categories:
                        if cat['type'] == 'expense' and any(keyword in desc_lower for keyword in ['rent', 'utilities', 'electricity', 'water']):
                            if 'rent' in cat['name'].lower() or 'utility' in cat['name'].lower():
                                category_id = cat['id']
                                break
                        elif cat['type'] == 'income' and any(keyword in desc_lower for keyword in ['salary', 'payment received', 'sales']):
                            if 'salary' in cat['name'].lower() or 'sales' in cat['name'].lower():
                                category_id = cat['id']
                                break
                
                transaction_type = "credit" if credit > 0 else "debit"
                amount = float(credit) if credit > 0 else float(debit)
                
                ledger_name = None
                if ledger_col and pd.notna(row.get(ledger_col)):
                    ledger_name = str(row[ledger_col]).strip()
                
                group_name = None
                if group_col and pd.notna(row.get(group_col)):
                    group_name = str(row[group_col]).strip()
                
                ref_no = None
                if ref_col and pd.notna(row.get(ref_col)):
                    ref_no = str(row[ref_col]).strip()
                
                cheque_no = None
                if cheque_col and pd.notna(row.get(cheque_col)):
                    cheque_no = str(row[cheque_col]).strip()

                txn_notes = None
                if notes_col and pd.notna(row.get(notes_col)):
                    txn_notes = str(row[notes_col]).strip()

                metadata = {}
                if account_holder_col and pd.notna(row.get(account_holder_col)):
                    metadata["account_holder"] = str(row[account_holder_col]).strip()
                if ledger_name: metadata["ledger_name_legacy"] = ledger_name # keep it for compatibility

                txn_kwargs = {
                    "user_id": current_user.id,
                    "account_id": account_id,
                    "date": normalize_date(date_str),
                    "description": description,
                    "amount": amount,
                    "type": transaction_type,
                    "category_id": category_id,
                    "ledger_name": ledger_name,
                    "group_name": group_name,
                    "reference_number": ref_no,
                    "cheque_number": cheque_no,
                    "notes": txn_notes,
                    "metadata": metadata if metadata else None
                }
                transaction = Transaction(**txn_kwargs)
                
                if transaction.date:
                    transaction.date = normalize_date(transaction.date)
                
                transaction_dict = transaction.model_dump()
                transaction_dict['created_at'] = transaction_dict['created_at'].isoformat()
                
                await db.transactions.insert_one(transaction_dict)
                
                # Update account balance
                if transaction_type == "credit":
                    await db.accounts.update_one(
                        {"id": account_id},
                        {"$inc": {"balance": amount}}
                    )
                else:
                    await db.accounts.update_one(
                        {"id": account_id},
                        {"$inc": {"balance": -amount}}
                    )
                
                imported_count += 1
            except Exception as e:
                logging.error(f"Error importing row: {e}")
                continue
        
        return {
            "message": f"Successfully imported {imported_count} transactions",
            "count": imported_count
        }
    
    except Exception as e:
        logging.error(f"Error processing CSV: {e}")
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")

# ==================== REPORTS ROUTES ====================

@api_router.get("/reports/summary")
async def get_summary_report(current_user: User = Depends(get_current_user)):
    # Exclude opening balance transactions from reports
    transactions = await db.transactions.find(
        {"user_id": current_user.id, "type": {"$ne": "opening"}}, 
        {"_id": 0}
    ).to_list(10000)
    
    total_income = sum(t['amount'] for t in transactions if t['type'] == 'credit')
    total_expense = sum(t['amount'] for t in transactions if t['type'] == 'debit')
    net_balance = total_income - total_expense
    
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_balance": net_balance,
        "transaction_count": len(transactions)
    }

@api_router.get("/reports/category-breakdown")
async def get_category_breakdown(current_user: User = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": current_user.id}, {"_id": 0}).to_list(10000)
    categories = await db.categories.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    category_map = {cat['id']: cat for cat in categories}
    
    breakdown = {}
    
    for txn in transactions:
        cat_id = txn.get('category_id')
        if cat_id and cat_id in category_map:
            cat_name = category_map[cat_id]['name']
            if cat_name not in breakdown:
                breakdown[cat_name] = {
                    "name": cat_name,
                    "type": category_map[cat_id]['type'],
                    "color": category_map[cat_id]['color'],
                    "total": 0,
                    "count": 0
                }
            breakdown[cat_name]['total'] += txn['amount']
            breakdown[cat_name]['count'] += 1
    
    return list(breakdown.values())

@api_router.get("/reports/monthly-trend")
async def get_monthly_trend(current_user: User = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": current_user.id}, {"_id": 0}).to_list(10000)
    
    monthly_data = {}
    
    for txn in transactions:
        try:
            # Parse different date formats
            date_str = txn['date']
            if '-' in date_str:
                parts = date_str.split('-')
                if len(parts[0]) == 4:  # YYYY-MM-DD
                    month_key = f"{parts[0]}-{parts[1]}"
                else:  # DD-MM-YYYY
                    month_key = f"{parts[2]}-{parts[1]}"
            else:
                continue
            
            if month_key not in monthly_data:
                monthly_data[month_key] = {"month": month_key, "income": 0, "expense": 0}
            
            if txn['type'] == 'credit':
                monthly_data[month_key]['income'] += txn['amount']
            else:
                monthly_data[month_key]['expense'] += txn['amount']
        except:
            continue
    
    return sorted(monthly_data.values(), key=lambda x: x['month'])

@api_router.get("/reports/balance-sheet")
async def get_balance_sheet(
    as_of_date: Optional[str] = None,  # DD-MM-YYYY
    current_user: User = Depends(get_current_user)
):
    if not as_of_date:
        as_of_date = datetime.now().strftime('%d-%m-%Y')
    
    # Utility to compare dates
    def get_date_obj(date_str):
        try: return datetime.strptime(date_str, '%d-%m-%Y')
        except: return datetime.min
        
    as_of_obj = get_date_obj(as_of_date)
    
    # Fetch accounts & transactions
    accounts = await db.accounts.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    transactions = await db.transactions.find({"user_id": current_user.id}, {"_id": 0}).to_list(100000)
    
    # Structure for response
    results = {
        "as_of_date": as_of_date,
        "assets": {
            "current_assets": {
                "bank_accounts": [],
                "cash_in_hand": [],
                "total": 0
            },
            "total_assets": 0
        },
        "liabilities": {
            "current_liabilities": {
                "credit_cards": [],
                "total": 0
            },
            "total_liabilities": 0
        },
        "equity": {
            "net_income": 0,
            "retained_earnings": 0,
            "total_equity": 0
        },
        "total_liabilities_and_equity": 0,
        "is_balanced": False
    }
    
    # 1. Calculate Account Balances as of Date
    for acc in accounts:
        # Start with opening balance
        balance = acc.get('opening_balance', 0)
        
        # Add historical transactions up to as_of_date
        acc_txns = [t for t in transactions if t['account_id'] == acc['id'] and get_date_obj(t['date']) <= as_of_obj and t['type'] != 'opening']
        
        for txn in acc_txns:
            if txn['type'] == 'credit':
                balance += txn['amount']
            else:
                balance -= txn['amount']
                
        account_entry = {"name": acc['account_name'], "balance": balance, "bank": acc.get('bank_name')}
        
        # Categorize by type
        if acc['account_type'] == "Bank":
            results["assets"]["current_assets"]["bank_accounts"].append(account_entry)
            results["assets"]["current_assets"]["total"] += balance
        elif acc['account_type'] == "Cash":
            results["assets"]["current_assets"]["cash_in_hand"].append(account_entry)
            results["assets"]["current_assets"]["total"] += balance
        elif acc['account_type'] == "Card":
            # Credit cards are liabilities
            results["liabilities"]["current_liabilities"]["credit_cards"].append(account_entry)
            results["liabilities"]["current_liabilities"]["total"] += balance
            
    results["assets"]["total_assets"] = results["assets"]["current_assets"]["total"]
    results["liabilities"]["total_liabilities"] = results["liabilities"]["current_liabilities"]["total"]
    
    # 2. Calculate Equity (Net Income = Total Income - Total Expense up to date)
    relevant_txns = [t for t in transactions if get_date_obj(t['date']) <= as_of_obj and t['type'] != 'opening']
    total_income = sum(t['amount'] for t in relevant_txns if t['type'] == 'credit')
    total_expense = sum(t['amount'] for t in relevant_txns if t['type'] == 'debit')
    
    results["equity"]["net_income"] = total_income - total_expense
    results["equity"]["retained_earnings"] = results["equity"]["net_income"]
    results["equity"]["total_equity"] = results["equity"]["retained_earnings"]
    
    # 3. Balance Check
    results["total_liabilities_and_equity"] = results["liabilities"]["total_liabilities"] + results["equity"]["total_equity"]
    # Due to simplified accounting, they might not perfectly match if manual edits happened without double entry
    # But for this system, it should theoretically align.
    results["is_balanced"] = abs(results["assets"]["total_assets"] - results["total_liabilities_and_equity"]) < 0.01
    
    return results

@api_router.get("/reports/cash-flow")
async def get_cash_flow(
    date_from: Optional[str] = None,  # DD-MM-YYYY
    date_to: Optional[str] = None,    # DD-MM-YYYY
    current_user: User = Depends(get_current_user)
):
    # Default to current Indian Fiscal Year (Apr 1 - Mar 31)
    today = datetime.now()
    if not date_from or not date_to:
        if today.month < 4:
            df = f"01-04-{today.year - 1}"
            dt = f"31-03-{today.year}"
        else:
            df = f"01-04-{today.year}"
            dt = f"31-03-{today.year + 1}"
        date_from = date_from or df
        date_to = date_to or dt

    def get_date_obj(date_str):
        try: return datetime.strptime(date_str, '%d-%m-%Y')
        except: return datetime.min

    from_obj = get_date_obj(date_from)
    to_obj = get_date_obj(date_to)

    # 1. Fetch Data
    accounts = await db.accounts.find({"user_id": current_user.id, "account_type": {"$in": ["Bank", "Cash"]}}, {"_id": 0}).to_list(1000)
    transactions = await db.transactions.find({"user_id": current_user.id}, {"_id": 0}).to_list(100000)
    categories = await db.categories.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    cat_map = {c['id']: c for c in categories}

    # 2. Opening Cash Balance (Bank + Cash accounts only)
    opening_cash = 0
    account_ids = [a['id'] for a in accounts]
    
    for acc in accounts:
        bal = acc.get('opening_balance', 0)
        # Add credits/debits before date_from
        historical = [t for t in transactions if t['account_id'] == acc['id'] and get_date_obj(t['date']) < from_obj and t['type'] != 'opening']
        for txn in historical:
            if txn['type'] == 'credit': bal += txn['amount']
            else: bal -= txn['amount']
        opening_cash += bal

    # 3. Operating Activities (categorized income/expense within range)
    op_items = {}
    range_txns = [t for t in transactions if t['account_id'] in account_ids and from_obj <= get_date_obj(t['date']) <= to_obj and t['type'] != 'opening']
    
    for txn in range_txns:
        cat_id = txn.get('category_id')
        cat = cat_map.get(cat_id)
        name = cat['name'] if cat else ("Other Income" if txn['type'] == 'credit' else "Other Expense")
        
        if name not in op_items:
            op_items[name] = {"name": name, "category_type": cat['type'] if cat else txn['type'], "amount": 0}
        
        amt = txn['amount']
        if txn['type'] == 'credit': op_items[name]['amount'] += amt
        else: op_items[name]['amount'] -= amt

    net_operating = sum(i['amount'] for i in op_items.values())

    return {
        "period": {"from": date_from, "to": date_to},
        "operating_activities": {
            "items": list(op_items.values()),
            "net_cash": net_operating
        },
        "investing_activities": {"items": [], "net_cash": 0, "note": "Asset tracking not yet implemented"},
        "financing_activities": {"items": [], "net_cash": 0, "note": "Loan tracking not yet implemented"},
        "net_change_in_cash": net_operating,
        "opening_cash_balance": opening_cash,
        "closing_cash_balance": opening_cash + net_operating
    }

@api_router.get("/reports/gst-summary")
async def get_gst_summary(
    month: int,
    year: int,
    current_user: User = Depends(get_current_user)
):
    # Fetch all invoices for the month
    # Format month/year for matching
    month_str = f"{month:02d}"
    year_str = str(year)
    
    # Simple regex or string match for the month-year
    # Invoices/Transactions use DD-MM-YYYY
    match_pattern = f"-{month_str}-{year_str}"
    
    invoices = await db.invoices.find({
        "user_id": current_user.id,
        "date": {"$regex": match_pattern},
        "status": {"$in": ["paid", "sent"]}
    }).to_list(1000)
    
    transactions = await db.transactions.find({
        "user_id": current_user.id,
        "date": {"$regex": match_pattern},
        "type": "debit"
    }).to_list(10000)
    
    # 1. Calculate Output Tax (Sales)
    total_taxable_sales = 0
    total_output_gst = 0
    
    for inv in invoices:
        tax_amt = inv.get('tax_amount', 0)
        total_output_gst += tax_amt
        # Taxable value = total - tax
        total_taxable_sales += (inv.get('total_amount', 0) - tax_amt)
        
    # 2. Calculate Input Tax Credit (ITC - Expenses)
    # Filter for 'Expense' categories for better accuracy if possible
    total_taxable_purchases = 0
    total_itc = 0
    
    for txn in transactions:
        # For prototype: Assume 18% GST if not specified in metadata
        amt = txn.get('amount', 0)
        metadata = txn.get('metadata', {})
        
        gst_amt = metadata.get('gst_amount')
        if gst_amt is not None:
            itc = float(gst_amt)
        else:
            # Reverse calculate from 18%
            # Amount = Base + 18% Base = 1.18 * Base
            # Tax = Amount - (Amount / 1.18)
            itc = amt - (amt / 1.18)
            
        total_itc += itc
        total_taxable_purchases += (amt - itc)
        
    return {
        "period": f"{month_str}/{year_str}",
        "gstr1": {
            "total_taxable_value": round(total_taxable_sales, 2),
            "total_gst_collected": round(total_output_gst, 2),
            "invoice_count": len(invoices)
        },
        "gstr3b": {
            "output_tax": round(total_output_gst, 2),
            "input_tax_credit": round(total_itc, 2),
            "net_gst_payable": round(max(0, total_output_gst - total_itc), 2),
            "excess_itc": round(max(0, total_itc - total_output_gst), 2)
        }
    }

# ==================== AUDIT & AUTOMATION ROUTES ====================

@api_router.get("/audit-logs", response_model=List[AuditLog])
async def get_audit_logs(current_user: User = Depends(get_current_user)):
    # Recent 1000 logs
    logs = await db.audit_logs.find({"user_id": current_user.id}).sort("timestamp", -1).to_list(1000)
    for log in logs:
        log.pop("_id", None)
        if isinstance(log.get('timestamp'), str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    return logs

@api_router.post("/automation-rules", response_model=AutomationRule)
async def create_automation_rule(rule_data: AutomationRuleCreate, current_user: User = Depends(get_current_user)):
    rule = AutomationRule(
        user_id=current_user.id,
        **rule_data.model_dump()
    )
    rule_dict = rule.model_dump()
    rule_dict['created_at'] = rule_dict['created_at'].isoformat()
    await db.automation_rules.insert_one(rule_dict)
    
    await log_action(current_user.id, "create", "automation_rule", f"Created rule for keyword: {rule.keyword}")
    return rule

@api_router.get("/automation-rules", response_model=List[AutomationRule])
async def get_automation_rules(current_user: User = Depends(get_current_user)):
    rules = await db.automation_rules.find({"user_id": current_user.id}).to_list(100)
    for r in rules:
        r.pop("_id", None)
        if isinstance(r.get('created_at'), str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return rules

@api_router.delete("/automation-rules/{rule_id}")
async def delete_automation_rule(rule_id: str, current_user: User = Depends(get_current_user)):
    await db.automation_rules.delete_one({"id": rule_id, "user_id": current_user.id})
    await log_action(current_user.id, "delete", "automation_rule", f"Deleted rule: {rule_id}")
    return {"message": "Rule deleted"}

@api_router.post("/automation-rules/apply-bulk")
async def bulk_apply_rules(current_user: User = Depends(get_current_user)):
    rules = await db.automation_rules.find({"user_id": current_user.id, "is_active": True}).to_list(100)
    if not rules:
        return {"message": "No active rules found"}
    
    # Fetch past uncategorized transactions
    transactions = await db.transactions.find({
        "user_id": current_user.id, 
        "category_id": None
    }).to_list(5000)
    
    updated_count = 0
    for txn in transactions:
        desc_lower = txn['description'].lower()
        for rule in rules:
            if rule['keyword'].lower() in desc_lower:
                await db.transactions.update_one(
                    {"id": txn['id']},
                    {"$set": {"category_id": rule['category_id']}}
                )
                updated_count += 1
                break
                
    await log_action(current_user.id, "bulk_apply", "automation", f"Applied rules to {updated_count} transactions")
    return {"message": f"Successfully categorized {updated_count} transactions"}

# ==================== DATA EXPORT & BACKUP ROUTES ====================

@api_router.get("/export/all")
async def export_all_data(current_user: User = Depends(get_current_user)):
    # Fetch all collections for this user
    clients = await db.clients.find({"user_id": current_user.id}, {"_id": 0}).to_list(10000)
    accounts = await db.accounts.find({"user_id": current_user.id}, {"_id": 0}).to_list(10000)
    categories = await db.categories.find({"user_id": current_user.id}, {"_id": 0}).to_list(10000)
    transactions = await db.transactions.find({"user_id": current_user.id}, {"_id": 0}).to_list(100000)
    invoices = await db.invoices.find({"user_id": current_user.id}, {"_id": 0}).to_list(10000)
    
    # Audit Logs (Bonus for comprehensive backup)
    audit_logs = await db.audit_logs.find({"user_id": current_user.id}, {"_id": 0}).to_list(5000)
    automation_rules = await db.automation_rules.find({"user_id": current_user.id}, {"_id": 0}).to_list(200)

    # User basic info
    user_data = await db.users.find_one({"id": current_user.id}, {"_id": 0, "password_hash": 0})

    export_data = {
        "export_version": "1.0",
        "export_date": datetime.now(timezone.utc).isoformat(),
        "app": "Vitta",
        "user_id": current_user.id,
        "user_info": {
            "name": user_data.get("name"),
            "email": user_data.get("email"),
            "business_name": user_data.get("business_name")
        },
        "data": {
            "clients": clients,
            "accounts": accounts,
            "categories": categories,
            "transactions": transactions,
            "invoices": invoices,
            "audit_logs": audit_logs,
            "automation_rules": automation_rules
        },
        "counts": {
            "clients": len(clients),
            "accounts": len(accounts),
            "categories": len(categories),
            "transactions": len(transactions),
            "invoices": len(invoices)
        }
    }

    content = json.dumps(export_data, default=str, indent=2)
    filename = f"vitta_backup_{datetime.now().strftime('%Y%p%d_%H%M%S')}.json"
    
    await log_action(current_user.id, "export", "backup", "Full JSON backup exported")
    
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/export/transactions")
async def export_transactions(
    format: str = "csv",  # "csv" or "excel"
    current_user: User = Depends(get_current_user)
):
    # Fetch data
    txns = await db.transactions.find(
        {"user_id": current_user.id, "type": {"$ne": "opening"}}, 
        {"_id": 0}
    ).sort("date", -1).to_list(50000)
    
    if not txns:
        raise HTTPException(status_code=404, detail="No transactions found to export")
        
    # Map accounts and categories for names
    accounts = {a["id"]: a["account_name"] for a in await db.accounts.find({"user_id": current_user.id}).to_list(1000)}
    categories = {c["id"]: c["name"] for c in await db.categories.find({"user_id": current_user.id}).to_list(1000)}
    
    processed_list = []
    for t in txns:
        processed_list.append({
            "Date": t.get("date"),
            "Description": t.get("description"),
            "Account": accounts.get(t.get("account_id"), "Unknown"),
            "Category": categories.get(t.get("category_id"), "Uncategorized"),
            "Ledger": t.get("ledger_name", ""),
            "Reference": t.get("reference_number", ""),
            "Debit": t.get("amount", 0) if t.get("type") == "debit" else 0,
            "Credit": t.get("amount", 0) if t.get("type") == "credit" else 0,
            "Notes": t.get("notes", "")
        })
        
    df = pd.DataFrame(processed_list)
    
    await log_action(current_user.id, "export", "transactions", f"Transactions exported as {format}")

    if format.lower() == "excel":
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Transactions')
            # Basic formatting could be added here if needed
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=vitta_transactions_{datetime.now().strftime('%Y%m%d')}.xlsx"}
        )
    else:
        # CSV
        csv_content = df.to_csv(index=False)
        return StreamingResponse(
            io.BytesIO(csv_content.encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=vitta_transactions_{datetime.now().strftime('%Y%m%d')}.csv"}
        )

@api_router.post("/import/restore")
async def restore_from_backup(
    file: UploadFile = File(...),
    mode: str = "merge",  # "merge" or "replace"
    current_user: User = Depends(get_current_user)
):
    try:
        contents = await file.read()
        import_data = json.loads(contents)
        
        if import_data.get("app") != "Vitta" or "data" not in import_data:
            raise HTTPException(status_code=400, detail="Invalid Vitta backup file")
            
        data = import_data["data"]
        results = {}
        
        # Replace mode: wipe all data first
        if mode == "replace":
            cols = ["clients", "accounts", "categories", "transactions", "invoices", "automation_rules"]
            for col in cols:
                await db[col].delete_many({"user_id": current_user.id})
            
        # Target collections
        collections = {
            "clients": data.get("clients", []),
            "accounts": data.get("accounts", []),
            "categories": data.get("categories", []),
            "transactions": data.get("transactions", []),
            "invoices": data.get("invoices", []),
            "automation_rules": data.get("automation_rules", [])
        }
        
        for col_name, items in collections.items():
            inserted = 0
            for item in items:
                # Ensure the data belongs to the current user
                item["user_id"] = current_user.id
                
                if mode == "merge":
                    # Check for existing ID
                    exists = await db[col_name].find_one({"id": item["id"], "user_id": current_user.id})
                    if exists: continue
                
                # Insert
                await db[col_name].insert_one(item)
                inserted += 1
            results[col_name] = inserted
            
        await log_action(current_user.id, "import", "restore", f"Data restored using {mode} mode")
        return {"message": "Data restored successfully", "results": results}
        
    except Exception as e:
        logger.error(f"Restore error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Restore failed: {str(e)}")

# ==================== GLOBAL SYSTEM CONFIG (UAC) ====================

@app.on_event("startup")
async def initialize_system_config():
    """Ensure the global config exists in the database on startup"""
    existing = await db.system_config.find_one({"id": "global_config"})
    if not existing:
        config = SystemConfig()
        config_dict = config.model_dump()
        config_dict['updated_at'] = config_dict['updated_at'].isoformat()
        await db.system_config.insert_one(config_dict)
        logger.info("Initialized global system configuration")

@api_router.get("/system/config")
async def get_system_config():
    """Fetch global feature flags for the entire platform"""
    config = await db.system_config.find_one({"id": "global_config"}, {"_id": 0})
    if not config:
        # Fallback to default if somehow missing
        return SystemConfig().model_dump()
    return config

@api_router.post("/system/config")
async def update_system_config(new_features: Dict[str, bool]):
    """Update global feature flags - Affects every user on the platform"""
    # Simply update the 'features' field and timestamp
    await db.system_config.update_one(
        {"id": "global_config"},
        {
            "$set": {
                "features": new_features,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    return {"message": "Global configuration updated successfully"}

# Global exception handler for debugging
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    error_msg = f"Global exception: {exc}\n{traceback.format_exc()}"
    logger.error(error_msg)
    return HTTPException(
        status_code=500, 
        detail=f"Internal Server Error: {str(exc)}. Please check Render logs for full traceback."
    )

# Include the router in the main app
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
