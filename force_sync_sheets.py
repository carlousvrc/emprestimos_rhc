import pickle
import pandas as pd
import os
import sheets_handler

db_path = os.path.join("dados", "cumulative_db.pkl")

if os.path.exists(db_path):
    try:
        print("Carregando DB restaurado...")
        with open(db_path, "rb") as f:
            data = pickle.load(f)
            df = data['df']
        
        print(f"Sincronizando {len(df)} registros com Google Sheets...")
        sheets_handler.sync_full_report(df)
        print("Sucesso! Google Sheets atualizado.")
    except Exception as e:
        print(f"Erro ao sincronizar: {e}")
else:
    print("DB não encontrado.")
