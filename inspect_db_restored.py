import pickle
import pandas as pd
import os

db_path = os.path.join("dados", "cumulative_db.pkl")

if os.path.exists(db_path):
    try:
        with open(db_path, "rb") as f:
            data = pickle.load(f)
            df = data['df']
            print(f"Total Registros: {len(df)}")
            print("Colunas:", df.columns.tolist())
            
            if 'Data' in df.columns:
                df['Data'] = pd.to_datetime(df['Data'], errors='coerce')
                print(f"Data Mínima: {df['Data'].min()}")
                print(f"Data Máxima: {df['Data'].max()}")
                
                # Conta por mês
                print("\nRegistros por Mês:")
                print(df['Data'].dt.to_period('M').value_counts().sort_index())
                
    except Exception as e:
        print(f"Erro ao ler pickle: {e}")
else:
    print(f"Arquivo não encontrado: {db_path}")
