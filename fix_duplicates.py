
import pandas as pd
import pickle
import os
import remote_persistence
from datetime import datetime

# Caminho do DB
DB_PATH = remote_persistence.CUMULATIVE_DB_FILE

def clean_duplicates():
    print(f"🔧 Iniciando limpeza de duplicatas em: {DB_PATH}")
    
    if not os.path.exists(DB_PATH):
        print(f"⚠️ Arquivo não encontrado localmente: {DB_PATH}")
        print("☁️ Tentando baixar da nuvem...")
        success, msg = remote_persistence.sync_down(DB_PATH, remote_persistence.CUMULATIVE_TAG)
        if not success:
            print(f"❌ Falha no download: {msg}")
            return
        print("✅ Download concluído.")

    try:
        with open(DB_PATH, 'rb') as f:
            data = pickle.load(f)
            df = data['df']
            
        print(f"📊 Registros atuais: {len(df)}")
        
        # 1. Remove linhas vazias/lixo (sem Documento ou Produto)
        initial_len = len(df)
        df = df[df['Documento'].notna() & (df['Documento'] != '') & (df['Documento'] != '-')]
        garbage_count = initial_len - len(df)
        if garbage_count > 0:
            print(f"🗑️ Removidas {garbage_count} linhas sem Documento/inválidas.")
            
        # 2. Deduplicação Agressiva (IGNORA DATA)
        # Se o mesmo documento/produto/valor aparecer com datas diferentes, mantemos o ÚLTIMO (mais recente assumindo ordem de insercao ou sort)
        
        # Ordena por data para manter o mais recente
        if 'Data' in df.columns:
            df['DataObj'] = pd.to_datetime(df['Data'], errors='coerce')
            df = df.sort_values(by='DataObj')
            df = df.drop(columns=['DataObj'])
            
        # Chave SEM DATA
        cols_key = ['Unidade Origem', 'Unidade Destino', 'Documento', 'Produto (Saída)', 'Produto (Entrada)', 'Valor Saída (R$)', 'Valor Entrada (R$)']
        
        # Remove duplicatas
        df_clean = df.drop_duplicates(subset=cols_key, keep='last')
        
        removed_count = initial_len - len(df_clean) - garbage_count
        
        if removed_count > 0 or garbage_count > 0:
            print(f"🧹 Duplicatas de conteúdo (ignorando data) removidas: {removed_count}")
            print(f"✅ Registros finais: {len(df_clean)}")
            
            # Salva de volta
            with open(DB_PATH, 'wb') as f:
                pickle.dump({
                    'df': df_clean,
                    'last_update': datetime.now() # Atualiza timestamp do DB
                }, f)
            print("💾 Banco salvo com sucesso!")
        else:
            print("✨ Nenhuma duplicata encontrada. O banco já está limpo.")
            
    except Exception as e:
        print(f"❌ Erro ao processar: {e}")

if __name__ == "__main__":
    clean_duplicates()
