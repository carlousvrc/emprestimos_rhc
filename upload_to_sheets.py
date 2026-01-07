
import pandas as pd
import pickle
import os
import remote_persistence
import sheets_handler

# Caminho do DB
DB_PATH = remote_persistence.CUMULATIVE_DB_FILE

def upload():
    print(f"🚀 Iniciando upload para o Google Sheets de: {DB_PATH}")
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Arquivo não encontrado: {DB_PATH}")
        return

    try:
        with open(DB_PATH, 'rb') as f:
            data = pickle.load(f)
            df = data['df']
            
        print(f"📊 Carregado localmente: {len(df)} registros")
        
        # Chama o handler para sobrescrever
        if sheets_handler.overwrite_data(df):
             print("\n✨ Sucesso! A planilha agora está idêntica ao banco local limpo.")
        else:
             print("\n❌ Falha no upload.")
            
    except Exception as e:
        print(f"❌ Erro crítico: {e}")

if __name__ == "__main__":
    upload()
