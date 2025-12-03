from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
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
import jwt
import bcrypt
import base64
from io import BytesIO
from PIL import Image
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'service_order_db')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class EquipmentInfo(BaseModel):
    serial_number: Optional[str] = None
    board_serial: Optional[str] = None

class Verification(BaseModel):
    item: str
    status: str  # BOA, RUIM, N/A
    observation: Optional[str] = None

class ServiceOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Informações básicas
    ticket_number: Optional[str] = None
    os_number: Optional[str] = None
    pat: Optional[str] = None
    opening_date: Optional[str] = None
    responsible_opening: Optional[str] = None
    responsible_tech: Optional[str] = None
    phone: Optional[str] = None
    
    # Cliente
    client_name: Optional[str] = None
    unit: Optional[str] = None
    service_address: Optional[str] = None
    
    # Equipamento
    equipment_type: Optional[str] = None  # Ex: IMPRESSORA
    equipment_brand: Optional[str] = None  # Ex: SAMSUNG
    equipment_model: Optional[str] = None  # Ex: M4070FR
    equipment_serial: Optional[str] = None
    equipment_board_serial: Optional[str] = None
    
    # Chamado
    call_info: Optional[str] = None
    materials: Optional[str] = None
    technical_report: Optional[str] = None
    
    # Verificações
    verifications: List[Verification] = Field(default_factory=list)
    
    # Contadores e pendências
    total_page_count: Optional[str] = None
    pending_issues: Optional[str] = None
    next_visit: Optional[str] = None
    equipment_replaced: Optional[bool] = False
    
    # Observações
    observations: Optional[str] = None
    
    # Metadata
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceOrderCreate(BaseModel):
    ticket_number: Optional[str] = None
    os_number: Optional[str] = None
    pat: Optional[str] = None
    opening_date: Optional[str] = None
    responsible_opening: Optional[str] = None
    responsible_tech: Optional[str] = None
    phone: Optional[str] = None
    client_name: Optional[str] = None
    unit: Optional[str] = None
    service_address: Optional[str] = None
    equipment_type: Optional[str] = None
    equipment_brand: Optional[str] = None
    equipment_model: Optional[str] = None
    equipment_serial: Optional[str] = None
    equipment_board_serial: Optional[str] = None
    call_info: Optional[str] = None
    materials: Optional[str] = None
    technical_report: Optional[str] = None
    verifications: List[Verification] = Field(default_factory=list)
    total_page_count: Optional[str] = None
    pending_issues: Optional[str] = None
    next_visit: Optional[str] = None
    equipment_replaced: Optional[bool] = False
    observations: Optional[str] = None

class ServiceOrderUpdate(BaseModel):
    ticket_number: Optional[str] = None
    os_number: Optional[str] = None
    pat: Optional[str] = None
    opening_date: Optional[str] = None
    responsible_opening: Optional[str] = None
    responsible_tech: Optional[str] = None
    phone: Optional[str] = None
    client_name: Optional[str] = None
    unit: Optional[str] = None
    service_address: Optional[str] = None
    equipment_type: Optional[str] = None
    equipment_brand: Optional[str] = None
    equipment_model: Optional[str] = None
    equipment_serial: Optional[str] = None
    equipment_board_serial: Optional[str] = None
    call_info: Optional[str] = None
    materials: Optional[str] = None
    technical_report: Optional[str] = None
    verifications: Optional[List[Verification]] = None
    total_page_count: Optional[str] = None
    pending_issues: Optional[str] = None
    next_visit: Optional[str] = None
    equipment_replaced: Optional[bool] = None
    observations: Optional[str] = None

class OCRResponse(BaseModel):
    extracted_text: str
    structured_data: dict

# ============ AUTH FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Convert ISO string to datetime if needed
        if isinstance(user_doc.get('created_at'), str):
            user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ OCR FUNCTION ============

async def extract_text_from_image(image_base64: str) -> dict:
    """Extract text from image and structure it for service order form"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        import json
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
        
        # Create chat instance
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message="""You are an intelligent OCR assistant specialized in extracting service order information from images.
Extract all visible information and return it in a structured JSON format that matches these exact field names:
{
  "ticket_number": "número do chamado",
  "os_number": "número da O.S.",
  "pat": "código PAT se presente",
  "opening_date": "data de abertura (formato: DD/MM/YYYY ou DD/MM)",
  "responsible_opening": "nome do responsável pela abertura",
  "responsible_tech": "nome do técnico responsável",
  "phone": "telefone",
  "client_name": "nome do cliente",
  "unit": "unidade/local",
  "service_address": "endereço completo de atendimento",
  "equipment_serial": "número de série do equipamento (S/N EQUIP)",
  "equipment_board_serial": "número de série da placa (S/N PLACA)",
  "equipment_type": "tipo de equipamento (IMPRESSORA, etc)",
  "equipment_brand": "marca do equipamento",
  "equipment_model": "modelo do equipamento",
  "call_info": "descrição do problema/chamado",
  "materials": "materiais utilizados",
  "technical_report": "laudo técnico",
  "total_page_count": "contador de páginas",
  "observations": "observações gerais"
}
Return ONLY valid JSON. If a field is not found, use null."""
        ).with_model("openai", "gpt-5.1")
        
        # Create image content
        image_content = ImageContent(image_base64=image_base64)
        
        # Create message
        user_message = UserMessage(
            text="""Analyze this service order image and extract ALL visible information. 
Pay special attention to:
- Números (chamado, O.S., PAT)
- Datas (abertura, próxima visita)
- Nomes (responsáveis, técnico, cliente)
- Equipamento (marca, modelo, números de série da placa e equipamento)
- Endereço completo
- Descrição do problema
- Materiais utilizados

Return the data in the exact JSON format specified in the system message. Be precise and extract everything visible.""",
            file_contents=[image_content]
        )
        
        # Send message and get response
        response = await chat.send_message(user_message)
        
        # Try to parse JSON from response
        try:
            # Clean response - remove markdown code blocks if present
            cleaned_response = response.strip()
            if cleaned_response.startswith("```"):
                # Remove ```json or ``` from start
                cleaned_response = cleaned_response.split("\\n", 1)[1]
            if cleaned_response.endswith("```"):
                # Remove ``` from end
                cleaned_response = cleaned_response.rsplit("\\n", 1)[0]
            
            structured_data = json.loads(cleaned_response)
        except json.JSONDecodeError:
            # If JSON parsing fails, return raw text
            logging.warning(f"Could not parse JSON from OCR response: {response}")
            structured_data = {
                "raw_ocr": response,
                "parse_error": True
            }
        
        return {
            "extracted_text": response,
            "structured_data": structured_data
        }
    except Exception as e:
        logging.error(f"OCR Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Service Order Management API"}

# Auth routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name
    )
    
    user_doc = user.model_dump()
    user_doc['password'] = hash_password(user_data.password)
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_access_token(user.id)
    
    return TokenResponse(access_token=token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    
    if not user_doc or not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Convert ISO string to datetime
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    token = create_access_token(user.id)
    
    return TokenResponse(access_token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Service Order routes
@api_router.post("/service-orders", response_model=ServiceOrder)
async def create_service_order(
    order_data: ServiceOrderCreate,
    current_user: User = Depends(get_current_user)
):
    order = ServiceOrder(
        **order_data.model_dump(),
        created_by=current_user.id
    )
    
    order_doc = order.model_dump()
    order_doc['created_at'] = order_doc['created_at'].isoformat()
    order_doc['updated_at'] = order_doc['updated_at'].isoformat()
    
    await db.service_orders.insert_one(order_doc)
    
    return order

@api_router.get("/service-orders", response_model=List[ServiceOrder])
async def get_service_orders(current_user: User = Depends(get_current_user)):
    orders = await db.service_orders.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO strings to datetime
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders

@api_router.get("/service-orders/{order_id}", response_model=ServiceOrder)
async def get_service_order(
    order_id: str,
    current_user: User = Depends(get_current_user)
):
    order = await db.service_orders.find_one({"id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Service order not found")
    
    # Convert ISO strings to datetime
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order.get('updated_at'), str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return ServiceOrder(**order)

@api_router.put("/service-orders/{order_id}", response_model=ServiceOrder)
async def update_service_order(
    order_id: str,
    order_data: ServiceOrderUpdate,
    current_user: User = Depends(get_current_user)
):
    existing_order = await db.service_orders.find_one({"id": order_id})
    
    if not existing_order:
        raise HTTPException(status_code=404, detail="Service order not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in order_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.service_orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    # Get updated order
    updated_order = await db.service_orders.find_one({"id": order_id}, {"_id": 0})
    
    # Convert ISO strings to datetime
    if isinstance(updated_order.get('created_at'), str):
        updated_order['created_at'] = datetime.fromisoformat(updated_order['created_at'])
    if isinstance(updated_order.get('updated_at'), str):
        updated_order['updated_at'] = datetime.fromisoformat(updated_order['updated_at'])
    
    return ServiceOrder(**updated_order)

@api_router.delete("/service-orders/{order_id}")
async def delete_service_order(
    order_id: str,
    current_user: User = Depends(get_current_user)
):
    result = await db.service_orders.delete_one({"id": order_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service order not found")
    
    return {"message": "Service order deleted successfully"}

# OCR route
@api_router.post("/ocr", response_model=OCRResponse)
async def process_ocr(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        # Read image file
        contents = await file.read()
        
        # Convert to base64
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        # Verify it's a valid image
        try:
            img = Image.open(BytesIO(contents))
            img.verify()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Process OCR
        result = await extract_text_from_image(image_base64)
        
        return OCRResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"OCR processing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process image")

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
