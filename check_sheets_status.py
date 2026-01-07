
import sheets_handler
import pandas as pd

def check_sheets():
    print("☁️ Baixando dados DIRETO do Google Sheets para inspeção...")
    try:
        df = sheets_handler.load_data_from_grids()
        if df is None:
            print("❌ Falha ao baixar da planilha.")
            return

        print(f"📊 Total registros na nuvem: {len(df)}")
        
        # Check colunas
        if 'Data' not in df.columns:
            print("❌ Coluna 'Data' não encontrada no Sheets.")
            print(f"Colunas: {df.columns.tolist()}")
            return
            
        # Check December
        print("🔎 Verificando Dezembro 2025...")
        
        # Sheets retorna tudo como string ou mix. Tenta string match primeiro
        mask_str = df['Data'].astype(str).str.contains('/12/2025') | df['Data'].astype(str).str.contains('-12-2025')
        count_str = mask_str.sum()
        print(f"🔎 Match String '12/2025': {count_str}")
        
        # Tenta parse
        df['DataObj'] = pd.to_datetime(df['Data'], errors='coerce')
        count_period = 0
        try:
             mask_period = (df['DataObj'].dt.month == 12) & (df['DataObj'].dt.year == 2025)
             count_period = mask_period.sum()
             print(f"📅 Match Date Object (Dez/25): {count_period}")
        except:
             print("Erro no parse de datas.")
             
        if count_str > 0 or count_period > 0:
            print("🚨 ALERTA: Dados de Dezembro AINDA ESTÃO NA NUVEM.")
            print(df[mask_str].head(3)[['Data', 'Documento', 'Valor Saída (R$)']])
        else:
             print("✅ NENHUM dado de Dezembro na nuvem.")
             
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    check_sheets()
