import os
import json
import pickle
import pandas as pd
from supabase_client import supabase, SupabaseManager
import time

def migrate_users():
    print("🚀 Iniciando migração de usuários...")
    if not os.path.exists("users.json"):
        print("⚠️ users.json não encontrado. Pulando.")
        return

    with open("users.json", "r", encoding="utf-8") as f:
        users_dict = json.load(f)

    # Prepara lista para inserção
    users_to_insert = []
    for username, data in users_dict.items():
        users_to_insert.append({
            "username": username,
            "password_hash": data["password"], # Já é hash
            "name": data["name"],
            "role": data["role"],
            "unit": data.get("unit")
        })

    if users_to_insert:
        try:
            # Upsert para não duplicar se rodar 2x
            data, count = supabase.table("users_app").upsert(users_to_insert).execute()
            print(f"✅ {len(users_to_insert)} usuários migrados com sucesso!")
        except Exception as e:
            print(f"❌ Erro ao migrar usuários: {e}")
    else:
        print("ℹ️ Nenhum usuário para migrar.")

def clean_value(val):
    """Limpa valores NaN/NaT para None (requisito do JSON/SQL)"""
    if pd.isna(val):
        return None
    return val

def migrate_analises():
    print("\n🚀 Iniciando migração de histórico de análises...")
    db_path = os.path.join("dados", "cumulative_db.pkl")
    
    if not os.path.exists(db_path):
        print(f"⚠️ {db_path} não encontrado. Pulando.")
        return

    try:
        with open(db_path, "rb") as f:
            data_pkl = pickle.load(f)
            df = data_pkl['df']
            
        print(f"📦 Carregado DF com {len(df)} registros.")
        
        # Mapeamento de colunas DF -> SQL
        # DF Columns (Expected): 
        # "Data", "Unidade Origem", ...
        
        batch_size = 100
        records_buffer = []
        total_migrated = 0
        batch_id = f"migration_{int(time.time())}"
        
        # Prepara DF para iteração
        # Converte datas para string ISO ou objeto python datetime
        # Supabase aceita string ISO para timestamp
        
        for idx, row in df.iterrows():
            record = {
                "data_saida": row.get("Data").isoformat() if hasattr(row.get("Data"), 'isoformat') else row.get("Data"),
                "unidade_origem": clean_value(row.get("Unidade Origem")),
                "unidade_destino": clean_value(row.get("Unidade Destino")),
                "documento": clean_value(row.get("Documento")),
                "produto_saida": clean_value(row.get("Produto (Saída)")),
                "produto_entrada": clean_value(row.get("Produto (Entrada)")),
                "especie": clean_value(row.get("Espécie")),
                "valor_saida": clean_value(row.get("Valor Saída (R$)")),
                "valor_entrada": clean_value(row.get("Valor Entrada (R$)")),
                "diferenca": clean_value(row.get("Diferença (R$)")),
                "status": clean_value(row.get("Status")),
                "tipo_divergencia": clean_value(row.get("Tipo de Divergência")),
                "qualidade_match": clean_value(row.get("Qualidade Match")),
                "observacoes": clean_value(row.get("Observações")),
                "detalhes_produto": clean_value(row.get("Detalhes Produto")),
                "import_batch_id": batch_id
            }
            
            # Limpeza final de NaNs que podem ter passado
            record = {k: (None if pd.isna(v) else v) for k, v in record.items()}
            
            records_buffer.append(record)
            
            if len(records_buffer) >= batch_size:
                supabase.table("analises_historico").insert(records_buffer).execute()
                total_migrated += len(records_buffer)
                print(f"   ... {total_migrated} registros inseridos.")
                records_buffer = []
                
        # Remanescentes
        if records_buffer:
            supabase.table("analises_historico").insert(records_buffer).execute()
            total_migrated += len(records_buffer)
            
        print(f"✅ Migração de Análises concluída! Total: {total_migrated}")

    except Exception as e:
        print(f"❌ Erro ao migrar análises: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Iniciando migração automática...")
    migrate_users()
    migrate_analises()
