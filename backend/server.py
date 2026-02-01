from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import pandas as pd
import io
import PyPDF2
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging at the top
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection with timeout
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Create the main app without a prefix
app = FastAPI()
api_router = APIRouter(prefix="/api")

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

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class BankAccountCreate(BaseModel):
    account_name: str
    bank_name: str
    opening_balance: float = 0.0

class BankAccount(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    account_name: str
    bank_name: str
    balance: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    type: str  # "income" or "expense"
    color: str = "#0F392B"

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    type: str
    color: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    account_id: str
    date: str
    description: str
    amount: float
    type: str  # "debit" or "credit"
    category_id: Optional[str] = None

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionUpdate(BaseModel):
    category_id: Optional[str] = None
    description: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    business_name: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

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
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)

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
        raise HTTPException(
            status_code=500, 
            detail="Database connection failed. If you are using MongoDB Atlas, please ensure your IP is whitelisted."
        )
    
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
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
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

# ==================== BANK ACCOUNT ROUTES ====================

@api_router.post("/accounts", response_model=BankAccount)
async def create_account(account_data: BankAccountCreate, current_user: User = Depends(get_current_user)):
    account = BankAccount(
        user_id=current_user.id,
        account_name=account_data.account_name,
        bank_name=account_data.bank_name,
        balance=account_data.opening_balance
    )
    
    account_dict = account.model_dump()
    account_dict['created_at'] = account_dict['created_at'].isoformat()
    
    await db.accounts.insert_one(account_dict)
    return account

@api_router.get("/accounts", response_model=List[BankAccount])
async def get_accounts(current_user: User = Depends(get_current_user)):
    accounts = await db.accounts.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for acc in accounts:
        if isinstance(acc.get('created_at'), str):
            acc['created_at'] = datetime.fromisoformat(acc['created_at'])
    
    return accounts

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str, current_user: User = Depends(get_current_user)):
    result = await db.accounts.delete_one({"id": account_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account deleted successfully"}

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
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# ==================== TRANSACTION ROUTES ====================

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate, current_user: User = Depends(get_current_user)):
    # Verify account belongs to user
    account = await db.accounts.find_one({"id": transaction_data.account_id, "user_id": current_user.id})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    transaction = Transaction(
        user_id=current_user.id,
        account_id=transaction_data.account_id,
        date=transaction_data.date,
        description=transaction_data.description,
        amount=transaction_data.amount,
        type=transaction_data.type,
        category_id=transaction_data.category_id
    )
    
    transaction_dict = transaction.model_dump()
    transaction_dict['created_at'] = transaction_dict['created_at'].isoformat()
    
    await db.transactions.insert_one(transaction_dict)
    
    # Update account balance
    if transaction.type == "credit":
        await db.accounts.update_one(
            {"id": transaction_data.account_id},
            {"$inc": {"balance": transaction_data.amount}}
        )
    else:
        await db.accounts.update_one(
            {"id": transaction_data.account_id},
            {"$inc": {"balance": -transaction_data.amount}}
        )
    
    return transaction

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    account_id: Optional[str] = None,
    category_id: Optional[str] = None,
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {"user_id": current_user.id}
    
    if account_id:
        query["account_id"] = account_id
    if category_id:
        query["category_id"] = category_id
    if type:
        query["type"] = type
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    
    for txn in transactions:
        if isinstance(txn.get('created_at'), str):
            txn['created_at'] = datetime.fromisoformat(txn['created_at'])
    
    return transactions

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(
    transaction_id: str,
    update_data: TransactionUpdate,
    current_user: User = Depends(get_current_user)
):
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.transactions.update_one(
        {"id": transaction_id, "user_id": current_user.id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
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
    
    # Reverse balance update
    if transaction["type"] == "credit":
        await db.accounts.update_one(
            {"id": transaction["account_id"]},
            {"$inc": {"balance": -transaction["amount"]}}
        )
    else:
        await db.accounts.update_one(
            {"id": transaction["account_id"]},
            {"$inc": {"balance": transaction["amount"]}}
        )
    
    await db.transactions.delete_one({"id": transaction_id})
    return {"message": "Transaction deleted successfully"}

# ==================== CSV IMPORT ROUTES ====================

@api_router.post("/import/csv")
async def import_csv(
    file: UploadFile = File(...),
    account_id: str = None,
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(('.csv', '.pdf')):
        raise HTTPException(status_code=400, detail="Only CSV and PDF files are supported")
    
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
                                    transactions_data.append({
                                        'Txn Date': date_str,
                                        'Description': description,
                                        'Dr Amount': dr_amount,
                                        'Cr Amount': cr_amount
                                    })
                                    logging.debug(f"Found transaction: {date_str} | {description} | Dr:{dr_amount} | Cr:{cr_amount}")
                
                logging.info(f"Total transactions found: {len(transactions_data)}")
                
                if not transactions_data:
                    # Log some sample lines for debugging
                    sample_lines = [l for l in lines if l.strip()][:10]
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
        else:
            # Handle CSV files
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Expected columns: Date, Description, Debit, Credit
        # Flexible column matching
        date_col = None
        desc_col = None
        debit_col = None
        credit_col = None
        
        for col in df.columns:
            col_lower = col.lower().strip()
            if 'date' in col_lower or 'txn date' in col_lower or 'transaction date' in col_lower:
                date_col = col
            elif 'description' in col_lower or 'narration' in col_lower or 'particulars' in col_lower:
                desc_col = col
            elif 'dr' in col_lower or 'debit' in col_lower or 'withdrawal' in col_lower:
                debit_col = col
            elif 'cr' in col_lower or 'credit' in col_lower or 'deposit' in col_lower:
                credit_col = col
        
        if not all([date_col, desc_col]):
            raise HTTPException(status_code=400, detail=f"CSV must have Date and Description columns. Found columns: {list(df.columns)}")

        
        imported_count = 0
        categories = await db.categories.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
        
        # Log detected columns for debugging
        logging.info(f"Detected columns - Date: {date_col}, Desc: {desc_col}, Debit: {debit_col}, Credit: {credit_col}")
        
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
                
                # Auto-categorize based on keywords
                category_id = None
                desc_lower = description.lower()
                
                for cat in categories:
                    if cat['type'] == 'expense' and any(keyword in desc_lower for keyword in ['rent', 'utilities', 'electricity', 'water']):
                        if 'rent' in cat['name'].lower():
                            category_id = cat['id']
                            break
                    elif cat['type'] == 'income' and any(keyword in desc_lower for keyword in ['salary', 'payment received', 'sales']):
                        if 'salary' in cat['name'].lower() or 'sales' in cat['name'].lower():
                            category_id = cat['id']
                            break
                
                transaction_type = "credit" if credit > 0 else "debit"
                amount = credit if credit > 0 else debit
                
                transaction = Transaction(
                    user_id=current_user.id,
                    account_id=account_id,
                    date=date_str,
                    description=description,
                    amount=amount,
                    type=transaction_type,
                    category_id=category_id
                )
                
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
    transactions = await db.transactions.find({"user_id": current_user.id}, {"_id": 0}).to_list(10000)
    
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

# Add CORS middleware BEFORE including the router
# Parse CORS origins from environment variable
cors_origins_str = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001,https://vittora.netlify.app,https://vitta-theta.vercel.app')
# Also allow any subdomains of netlify.app for convenience during renaming
allowed_origins = [origin.strip() for origin in cors_origins_str.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global exception handler for debugging
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    # Use the logger defined at the top
    logger.error(f"Global exception: {exc}\n{traceback.format_exc()}")
    return HTTPException(status_code=500, detail=str(exc))

# Include the router in the main app
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()