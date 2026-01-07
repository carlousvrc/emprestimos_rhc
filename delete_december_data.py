
import pandas as pd
import pickle
import os
import remote_persistence
import sheets_handler
from datetime import datetime

# Caminho do DB
DB_PATH = remote_persistence.CUMULATIVE_DB_FILE

def delete_period():
    print(f"🗑️ Iniciando remoção de dados do Período Anterior (Dezembro 2025) em: {DB_PATH}")
    
    if not os.path.exists(DB_PATH):
        print("❌ Arquivo local não encontrado.")
        return

    try:
        with open(DB_PATH, 'rb') as f:
            data = pickle.load(f)
            df = data['df']
            
        initial_len = len(df)
        print(f"📊 Total de registros antes: {initial_len}")
        
        # Garante datetime
        if 'Data' in df.columns:
            df['DataObj'] = pd.to_datetime(df['Data'], errors='coerce')
        
        # Filtro: Remover Dezembro 2025
        # Mês anterior dinâmico ou fixo? Fixo Dezembro 2025 como safe bet dado o contexto
        target_month = 12
        target_year = 2025
        
        # Mas vamos fazer dinâmico baseado na data atual pra ser "Período Anterior" real
        hoje = datetime.now()
        mes_ant = hoje.month - 1 if hoje.month > 1 else 12
        ano_ant = hoje.year if hoje.month > 1 else hoje.year - 1
        
        print(f"📅 Alvo da exclusão: Mês {mes_ant}/{ano_ant}")
        
        # Identifica linhas a remover
        mask_remove = (df['DataObj'].dt.month == mes_ant) & (df['DataObj'].dt.year == ano_ant)
        count_remove = mask_remove.sum()
        
        if count_remove == 0:
            print("⚠️ Nenhum registro encontrado para este período.")
            return

        # Mantém apenas o que NÃO é do mês alvo
        df_clean = df[~mask_remove].copy()
        df_clean = df_clean.drop(columns=['DataObj']) # Limpa aux
        
        print(f"✂️ Removendo {count_remove} registros...")
        print(f"✅ Registros restantes: {len(df_clean)}")
        
        # Salva Local
        with open(DB_PATH, 'wb') as f:
            pickle.dump({
                'df': df_clean,
                'last_update': datetime.now()
            }, f)
        print("💾 Banco local salvo.")
        
        # Upload para Sheets
        print("☁️ Atualizando Google Sheets...")
        if sheets_handler.overwrite_data(df_clean):
            print("✅ Google Sheets sincronizado com sucesso!")
        else:
            print("❌ Falha ao atualizar Google Sheets.")
            
    except Exception as e:
        print(f"❌ Erro crítico: {e}")

if __name__ == "__main__":
    delete_period()
