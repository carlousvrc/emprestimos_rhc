import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
import streamlit as st
import json

# URL da planilha fixa fornecida pelo usuário
SHEET_URL = "https://docs.google.com/spreadsheets/d/1UOYbkN1Ugo_PZyrRU9Q5WvYFEcsWkm6Y7uwGvyP_NF4/edit?usp=sharing"

def connect_to_sheets():
    """Conecta ao Google Sheets usando arquivo JSON ou secrets."""
    try:
        scope = [
            "https://spreadsheets.google.com/feeds",
            "https://www.googleapis.com/auth/drive"
        ]
        
        # Prioridade 1: Arquivo JSON local (mais robusto pra script)
        import os
        if os.path.exists("service_account.json"):
            creds = ServiceAccountCredentials.from_json_keyfile_name("service_account.json", scope)
        else:
            # Prioridade 2: Secrets do Streamlit
            creds_dict = dict(st.secrets["gcp_service_account"])
            creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
            
        client = gspread.authorize(creds)
        
        # Abre a planilha pela URL
        spreadsheet = client.open_by_url(SHEET_URL)
        return spreadsheet
    except Exception as e:
        print(f"Erro ao conectar ao Google Sheets: {e}")
        return None

def load_data_from_grids(sheet_name=None):
    """Carrega dados da planilha para um DataFrame."""
    try:
        sh = connect_to_sheets()
        if not sh: return None
        
        # Pega a primeira aba se não especificada
        if sheet_name:
            worksheet = sh.worksheet(sheet_name)
        else:
            worksheet = sh.get_worksheet(0)
            
        data = worksheet.get_all_records()
        df = pd.DataFrame(data)
        return df
    except Exception as e:
        print(f"Erro ao ler dados da planilha: {e}")
        return None

def append_data_to_sheets(df, sheet_name=None):
    """Adiciona novas linhas ao final da planilha."""
    try:
        sh = connect_to_sheets()
        if not sh: return False
        
        if sheet_name:
            worksheet = sh.worksheet(sheet_name)
        else:
            worksheet = sh.get_worksheet(0)

        # Prepara os dados para inserção
        # gspread espera lista de listas
        # Converte datetime para string para evitar erro de serialização
        df_to_save = df.copy()
        
        # Converte datas para string
        for col in df_to_save.select_dtypes(include=['datetime64[ns]', 'datetime']).columns:
            df_to_save[col] = df_to_save[col].astype(str)
            
        # Transforma em lista de listas
        values = df_to_save.values.tolist()
        
        # Adiciona
        worksheet.append_rows(values)
        return True
    except Exception as e:
        print(f"Erro ao salvar dados na planilha: {e}")
        return False

def overwrite_data(df, sheet_name=None):
    """Sobrescreve TODOS os dados da planilha com o DataFrame fornecido."""
    try:
        sh = connect_to_sheets()
        if not sh: return False
        
        if sheet_name:
            worksheet = sh.worksheet(sheet_name)
        else:
            worksheet = sh.get_worksheet(0)
            
        print(f"🧹 Limpando planilha: {worksheet.title}")
        worksheet.clear()
        
        # Converte para lista de listas (com headers)
        df_to_save = df.copy()
        
        # 1. Converte Datetimes e Timedeltas
        for col in df_to_save.select_dtypes(include=['datetime64[ns]', 'datetime', 'timedelta64[ns]']).columns:
             df_to_save[col] = df_to_save[col].astype(str).replace({'NaT': ''})

        # 2. Preenche NaNs com string vazia
        df_to_save = df_to_save.fillna('')
        
        # 3. CONVERSÃO FINAL AGRESSIVA PARA STRING
        # Isso resolve problemas de int64, float64, decimal, etc que o JSON odeia
        df_to_save = df_to_save.astype(str)
        
        # Limpa string 'nan' que o astype pode ter gerado
        df_to_save = df_to_save.replace({'nan': '', 'None': '', '<NA>': ''})
        
        # Headers + Dados
        values = [df_to_save.columns.tolist()] + df_to_save.values.tolist()
        
        print(f"📤 Enviando {len(values)} linhas para a nuvem...")
        worksheet.update(values)
        print("✅ Upload concluído!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao sobrescrever planilha: {e}")
        return False
        

def sync_full_report(df):
    """Sincroniza os 3 relatórios (Abas) com o Google Sheets (Sobrescreve tudo)."""
    if df is None or df.empty:
        print("⚠️ DataFrame vazio, nada a sincronizar.")
        return False
        
    print("🔄 Iniciando Sincronização Completa com Google Sheets (3 Abas)...")
    
    # 1. Análise Completa
    if not overwrite_data(df, "Análise Completa"):
        # Se falhar, tenta nome padrão (caso usuário não tenha renomeado)
        print("⚠️ Aba 'Análise Completa' não encontrada ou erro. Tentando aba padrão (0)...")
        if not overwrite_data(df, None): # Tenta index 0
             return False

    # 2. Não Conformes
    df_nc = df[df['Status'].str.contains('Não Conforme', na=False)]
    if not df_nc.empty:
        overwrite_data(df_nc, "Não Conformes")
    else:
        # Se vazio, limpa a aba para garantir
        overwrite_data(pd.DataFrame(columns=df.columns), "Não Conformes")

    # 3. Conformes
    df_c = df[df['Status'].str.contains('Conforme', na=False) & ~df['Status'].str.contains('Não', na=False)]
    if not df_c.empty:
        overwrite_data(df_c, "Conformes")
    else:
        overwrite_data(pd.DataFrame(columns=df.columns), "Conformes")
        
    print("✅ Sincronização Completa Finalizada!")
    return True

if __name__ == "__main__":
    # Teste rápido
    print("Tentando conectar...")
    sh = connect_to_sheets()
    if sh:
        print(f"Conectado: {sh.title}")
        df = load_data_from_grids()
        if df is not None:
            print(f"Dados carregados: {len(df)} linhas")
            print(df.head())
    else:
        print("Falha na conexão.")
