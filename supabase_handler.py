from supabase_client import supabase
import pandas as pd
from datetime import datetime

def load_analysis_history(limit=5000):
    """
    Carrega histórico de análises do Supabase.
    Retorna um DataFrame compatível com a aplicação existente.
    """
    try:
        # Busca últimos N registros
        response = supabase.table("analises_historico")\
            .select("*")\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
            
        data = response.data
        if not data:
            return pd.DataFrame()
            
        df = pd.DataFrame(data)
        
        # Renomeia colunas para o padrão do frontend (Português com espaços)
        # Isso evita refatorar todo o frontend agora
        column_map = {
            "data_saida": "Data",
            "unidade_origem": "Unidade Origem",
            "unidade_destino": "Unidade Destino",
            "documento": "Documento",
            "produto_saida": "Produto (Saída)",
            "produto_entrada": "Produto (Entrada)",
            "valor_saida": "Valor Saída (R$)",
            "valor_entrada": "Valor Entrada (R$)",
            "diferenca": "Diferença (R$)",
            "status": "Status",
            "tipo_divergencia": "Tipo de Divergência",
            "qualidade_match": "Qualidade Match",
            "observacoes": "Observações",
            "detalhes_produto": "Detalhes Produto",
            "especie": "Espécie"
        }
        
        df = df.rename(columns=column_map)
        
        # Converte tipos
        if "Data" in df.columns:
            df["Data"] = pd.to_datetime(df["Data"])
            # Remove Timezone para o Excel não reclamar
            df["Data"] = df["Data"].dt.tz_localize(None)
            
        return df
        
    except Exception as e:
        print(f"❌ Erro ao carregar histórico: {e}")
        return pd.DataFrame()

def save_analysis_result(df_result, batch_id=None):
    """
    Salva novos resultados no Supabase.
    Recebe o DF padrão do app.
    """
    try:
        if df_result.empty:
            return True
            
        # Mapeamento inverso (Frontend -> SQL)
        records = []
        if not batch_id:
            batch_id = f"auto_{datetime.now().strftime('%Y%m%d%H%M')}"
            
        for _, row in df_result.iterrows():
            record = {
                "data_saida": row.get("Data").isoformat() if hasattr(row.get("Data"), 'isoformat') else row.get("Data"),
                "unidade_origem": row.get("Unidade Origem"),
                "unidade_destino": row.get("Unidade Destino"),
                "documento": row.get("Documento"),
                "produto_saida": row.get("Produto (Saída)"),
                "produto_entrada": row.get("Produto (Entrada)"),
                "especie": row.get("Espécie"),
                "valor_saida": row.get("Valor Saída (R$)"),
                "valor_entrada": row.get("Valor Entrada (R$)"),
                "diferenca": row.get("Diferença (R$)"),
                "status": row.get("Status"),
                "tipo_divergencia": row.get("Tipo de Divergência"),
                "qualidade_match": row.get("Qualidade Match"),
                "observacoes": row.get("Observações"),
                "detalhes_produto": row.get("Detalhes Produto"),
                "import_batch_id": batch_id
            }
            
            # Limpa NaNs
            record = {k: (None if pd.isna(v) else v) for k, v in record.items()}
            records.append(record)
            
        # Inserção em lotes
        chunk_size = 100
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i + chunk_size]
            supabase.table("analises_historico").insert(chunk).execute()
            
        print(f"✅ {len(records)} registros salvos no Supabase.")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao salvar análise: {e}")
        return False
