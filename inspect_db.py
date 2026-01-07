
import pandas as pd
import pickle
import os
import remote_persistence
from datetime import datetime

# Caminho do DB
DB_PATH = remote_persistence.CUMULATIVE_DB_FILE

def inspect():
    print(f"🔍 Inspecionando: {DB_PATH}")
    
    if not os.path.exists(DB_PATH):
        print("❌ Arquivo não encontrado.")
        return

    with open(DB_PATH, 'rb') as f:
        data = pickle.load(f)
        df = data['df']
        
    print(f"📊 Total de registros: {len(df)}")
    
    # Converte Data
    df['DataObj'] = pd.to_datetime(df['Data'], errors='coerce')
    
    # Filtra Mês Anterior (Dezembro 2025, assumindo hoje Jan 2026)
    # Ajuste dinâmico
    hoje = datetime.now()
    mes_anterior = hoje.month - 1 if hoje.month > 1 else 12
    ano_anterior = hoje.year if hoje.month > 1 else hoje.year - 1
    
    # Remove filtro de mes para ver TUDO
    # df_mes = df[...] <--- Removido
    
    print(f"📊 Total Registros Global: {len(df)}")
    
    if 'Data' in df.columns:
        # Tenta converter tudo
        df['DataObj'] = pd.to_datetime(df['Data'], errors='coerce')
        
        # Min/Max
        min_date = df['DataObj'].min()
        max_date = df['DataObj'].max()
        print(f"📅 Range de Datas (Parsed): {min_date} até {max_date}")
        
        # Contagem por Mês/Ano
        print("\n📅 Distribuição por Mês/Ano:")
        print(df['DataObj'].dt.to_period('M').value_counts().sort_index())
        
        # String Match direto
        mask_str_dec = df['Data'].astype(str).str.contains('/12/2025') | df['Data'].astype(str).str.contains('-12-2025') | df['Data'].astype(str).str.contains('2025-12')
        count_str = mask_str_dec.sum()
        print(f"\n🔎 Registros '12/2025' (String Match): {count_str}")
        
        if count_str > 0:
            print("\nExemplo de strings encontradas:")
            print(df[mask_str_dec]['Data'].head(5))

    else:
        print("Coluna 'Data' não encontrada.")

if __name__ == "__main__":
    inspect()
