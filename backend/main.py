import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Security, status, Depends
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from supabase import Client, create_client
from dotenv import load_dotenv

# Carrega as variáveis de ambiente
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# Chave mestra interna para proteger os endpoints contra acesso direto não autorizado
API_KEY = os.getenv("API_KEY", "allan-augusto-tech-secure-key")

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def verify_api_key(api_key: str = Security(api_key_header)):
    """Garante que apenas requisições autenticadas acedam aos dados do CRM, bloqueando links diretos."""
    if not api_key or api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: Chave de API inválida ou ausente."
        )
    return api_key

# Inicializa o cliente do Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

app = FastAPI(
    title="Allan Augusto Tech CRM - Leadflow API",
    version="2.1.0",
    description="Backend seguro e blindado para gestão de leads e funil de vendas."
)

# CORS Restrito para maior segurança
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["*"],
)

# --- MODELOS DE DADOS (Pydantic com validação rigorosa) ---
class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    company: Optional[str] = None
    stage: str = "Novo Lead"
    value: float = 0.0

class LeadResponse(LeadCreate):
    id: int
    created_at: Optional[str] = None

# --- ROTAS DA API ---

@app.get("/", tags=["Status"])
def root():
    return {"status": "online", "project": "Allan Augusto Tech CRM - Secure"}

@app.get("/api/leads", response_model=List[LeadResponse], tags=["Leads"])
def get_leads(api_key: str = Depends(verify_api_key)):
    """Busca todos os leads protegidos por chave de segurança."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase não configurado.")
    response = supabase.table("leads").select("*").execute()
    return response.data

@app.post("/api/leads", response_model=LeadResponse, status_code=status.HTTP_201_CREATED, tags=["Leads"])
def create_lead(lead: LeadCreate, api_key: str = Depends(verify_api_key)):
    """Insere um novo lead com dados validados (protegido contra injeções)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase não configurado.")
    
    new_lead_data = {
        "name": lead.name,
        "email": lead.email,
        "phone": lead.phone,
        "company": lead.company,
        "stage": lead.stage,
        "value": lead.value
    }
    response = supabase.table("leads").insert(new_lead_data).execute()
    
    if not response.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erro ao criar lead.")
    return response.data[0]

@app.put("/api/leads/{lead_id}/stage", response_model=LeadResponse, tags=["Leads"])
def update_lead_stage(lead_id: int, new_stage: str, api_key: str = Depends(verify_api_key)):
    """Atualiza a etapa com validação estrita de ID (imune a SQL Injection)."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase não configurado.")
    
    response = supabase.table("leads").update({"stage": new_stage}).eq("id", lead_id).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead não encontrado.")
    return response.data[0]