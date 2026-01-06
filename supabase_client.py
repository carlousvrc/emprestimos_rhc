import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Singleton para evitar múltiplas conexões
class SupabaseManager:
    _instance = None
    _client: Client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        
        if not url or not key:
            print("❌ [Supabase] URL ou KEY não encontrados no .env")
            self._client = None
            return

        try:
            self._client = create_client(url, key)
            print(f"✅ [Supabase] Cliente inicializado para: {url}")
        except Exception as e:
            print(f"❌ [Supabase] Erro ao conectar: {e}")
            self._client = None

    @property
    def client(self):
        if self._client is None:
            self._initialize()
        return self._client

# Instância global para uso fácil
supabase = SupabaseManager().client
