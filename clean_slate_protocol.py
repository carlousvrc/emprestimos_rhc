
import pandas as pd
import pickle
import os
import remote_persistence
import sheets_handler
import datetime

def clean_slate():
    print("🧹 Iniciando Protocolo Clean Slate (Limpeza Total)...")
    
    # 1. Download do DB da Nuvem
    db_path = remote_persistence.CUMULATIVE_DB_FILE
    print(f"⬇️ Baixando DB da nuvem: {remote_persistence.CUMULATIVE_TAG}")
    remote_persistence.sync_down(db_path, remote_persistence.CUMULATIVE_TAG)
    
    if not os.path.exists(db_path):
        print("❌ DB não encontrado nem na nuvem nem local. Nada a limpar.")
        return

    # 2. Carregar e Limpar
    with open(db_path, 'rb') as f:
        data = pickle.load(f)
        df = data['df']
    
    print(f"📊 Total Registros Antes: {len(df)}")
    
    if 'Data' in df.columns:
        df['DataObj'] = pd.to_datetime(df['Data'], errors='coerce')
        mask_2025_12 = (df['DataObj'].dt.year == 2025) & (df['DataObj'].dt.month == 12)
        count_bad = mask_2025_12.sum()
        
        if count_bad > 0:
            print(f"🚫 Removendo {count_bad} registros de Dezembro/2025...")
            df_clean = df[~mask_2025_12].drop(columns=['DataObj'])
            
            # 3. Salvar Localmente
            data['df'] = df_clean
            data['last_update'] = datetime.datetime.now()
            with open(db_path, 'wb') as f:
                pickle.dump(data, f)
                
            print(f"💾 DB Local salvo com {len(df_clean)} registros.")
            
            # 4. Sync UP (Cloud)
            print("⬆️ Enviando DB Limpo para a Nuvem...")
            ok_up, msg_up = remote_persistence.sync_up(db_path, remote_persistence.CUMULATIVE_TAG)
            if ok_up:
                print("✅ Nuvem Sincronizada com Sucesso!")
            else:
                print(f"❌ Falha no Sync UP: {msg_up}")
                
            # 5. Sync Sheets
            print("📊 Atualizando Google Sheets...")
            if sheets_handler.sync_full_report(df_clean):
                print("✅ Google Sheets Atualizado!")
            else:
                print("❌ Falha no Google Sheets.")
                
        else:
            print("✅ Nenhum registro de Dez/2025 encontrado. O DB já está limpo.")
            # Força sync up mesmo assim para garantir consistência se a nuvem estiver desatualizada
            remote_persistence.sync_up(db_path, remote_persistence.CUMULATIVE_TAG)
            
    else:
        print("❌ Coluna 'Data' não encontrada no DB.")

    # 6. Limpar Cache Local do Streamlit
    print("🗑️ Limpando caches locais...")
    try:
        os.remove("dados/resultado_diario.pkl") 
        print("   removido: dados/resultado_diario.pkl")
    except: pass
    
    print("\n✅ Protocolo Finalizado. POR FAVOR, REINICIE O SERVIDOR STREAMLIT AGORA.")

if __name__ == "__main__":
    clean_slate()
