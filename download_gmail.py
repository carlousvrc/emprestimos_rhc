import imaplib
import email
from email.header import decode_header
import os
from datetime import datetime
import datetime as dt
import re

# Configurações - Substitua pelos seus dados ou use variáveis de ambiente
# Para gerar sennha de app: https://myaccount.google.com/apppasswords
# Configurações - Substitua pelos seus dados ou use variáveis de ambiente
# Para gerar sennha de app: https://myaccount.google.com/apppasswords
try:
    import streamlit as st
    secrets = st.secrets
except:
    secrets = {}

EMAIL_USER = secrets.get("GMAIL_USER") if "GMAIL_USER" in secrets else os.environ.get("GMAIL_USER", "gestao_mxm@grupohospitalcasa.com.br")
EMAIL_PASS = secrets.get("GMAIL_APP_PASSWORD") if "GMAIL_APP_PASSWORD" in secrets else os.environ.get("GMAIL_APP_PASSWORD", "")
EMAIL_PASS = EMAIL_PASS.replace(" ", "")

SEARCH_SENDER = secrets.get("GMAIL_SENDER") if "GMAIL_SENDER" in secrets else os.environ.get("GMAIL_SENDER", "pedro.gomes@hospitaldecancer.com.br") 
SEARCH_SUBJECT = os.environ.get("GMAIL_SUBJECT", "") # Deixe vazio para ignorar
DOWNLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dados", "input")

def connect_gmail():
    """Conecta ao Gmail usando IMAP."""
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(EMAIL_USER, EMAIL_PASS)
        return mail
    except Exception as e:
        print(f"Erro ao conectar no Gmail: {e}")
        return None

def download_daily_attachments():
    """Busca e baixa os anexos do dia."""
    if EMAIL_USER == "seu_email@gmail.com":
        print("⚠️ Configure as credenciais no arquivo ou variáveis de ambiente!")
        return False

    mail = connect_gmail()
    if not mail:
        return False

    try:
        mail.select("inbox")

        # Função auxiliar para data IMAP (Garante Ingles)
        def get_imap_date(dt_obj):
            months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            day = dt_obj.day
            month = months[dt_obj.month - 1]
            year = dt_obj.year
            return f"{day}-{month}-{year}"

        # 1. TENTA BUSCAR POR DATA (Últimos 15 dias)
        date_obj = datetime.now() - dt.timedelta(days=15)
        date_str = get_imap_date(date_obj)
        
        # ESTRATÉGIA DE BUSCA EM CASCATA (FALLBACKS)
        
        queries_to_try = []
        
        # 1. Busca Específica (Data + Sender + Subject) - Mais restritiva
        q1 = f'(SINCE "{date_str}")'
        if SEARCH_SENDER: q1 += f' FROM "{SEARCH_SENDER}"'
        if SEARCH_SUBJECT: q1 += f' SUBJECT "{SEARCH_SUBJECT}"'
        queries_to_try.append(("Busca Estrita (Data+Remetente)", q1))
        
        # 2. Busca por Data + Remetente (Ignora Assunto)
        if SEARCH_SUBJECT:
            q2 = f'(SINCE "{date_str}")'
            if SEARCH_SENDER: q2 += f' FROM "{SEARCH_SENDER}"'
            queries_to_try.append(("Busca Sem Assunto", q2))
            
        # 3. Busca Apenas por Data (Ignora Remetente, pode pegar forwarded)
        q3 = f'(SINCE "{date_str}")'
        queries_to_try.append(("Busca Ampla por Data", q3))
        
        # 4. Fallback: Últimos 10 emails do Remetente (Ignora Data)
        if SEARCH_SENDER:
            q4 = f'(FROM "{SEARCH_SENDER}")'
            queries_to_try.append(("Fallback: Histórico Remetente", q4))
            
        # 5. Fallback Final: Últimos 15 emails da Caixa de Entrada (Ignora Tudo)
        q5 = "ALL"
        queries_to_try.append(("Fallback: Qualquer Email Recente", q5))
        
        email_ids = []
        
        for label, query in queries_to_try:
            print(f"🔍 Tentando: {label}...")
            status, messages = mail.search(None, query)
            
            if status == "OK":
                ids = messages[0].split()
                if ids:
                    print(f"   ✅ Encontrados {len(ids)} emails.")
                    # Se for busca ALL ou Sender Fallback, pega apenas os últimos X para não iterar a caixa toda
                    if label.startswith("Fallback"):
                        ids = ids[-15:] 
                    
                    email_ids = ids
                    break # Achou algo! Para a cascata e vai verificar anexos
                else:
                    print("   ⚠️ Nenhum resultado.")
            else:
                print("   ❌ Erro na query.")
        
        if not email_ids:
            print("❌ Falha Total: Nenhum email encontrado em nenhuma estratégia de busca.")
            return False
            
        print(f"📧 Encontrados {len(email_ids)} emails. Procurando anexos no mais recente...")
        
        # Itera do mais recente para o mais antigo (reversed)
        for email_id in reversed(email_ids):
            status, msg_data = mail.fetch(email_id, "(RFC822)")
            
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding if encoding else "utf-8")
                    
                    print(f"📩 Verificando email: {subject}")
                    
                    # Verifica preliminar de anexos antes de limpar a pasta
                    temp_attachments = []
                    for part in msg.walk():
                        if part.get_content_maintype() == "multipart": continue
                        if part.get("Content-Disposition") is None: continue
                        filename = part.get_filename()
                        if filename and (filename.endswith(".xlsx") or filename.endswith(".xls")):
                            temp_attachments.append(part)
                            
                    if len(temp_attachments) >= 1: # Aceita se tiver pelo menos 1, mas idealmente 2
                        print(f"✅ Encontrados {len(temp_attachments)} anexos Excel neste e-mail. Baixando...")
                        
                        # Limpa pasta apenas agora que garantimos que vamos baixar novos
                        os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)
                        for f in os.listdir(DOWNLOAD_FOLDER):
                            try:
                                os.remove(os.path.join(DOWNLOAD_FOLDER, f))
                            except: pass
                            
                        attachments_downloaded = 0
                        for part in temp_attachments:
                            filename = part.get_filename()
                            if decode_header(filename)[0][1]:
                                filename = decode_header(filename)[0][0].decode(decode_header(filename)[0][1])
                            
                            filepath = os.path.join(DOWNLOAD_FOLDER, filename)
                            with open(filepath, "wb") as f:
                                f.write(part.get_payload(decode=True))
                            print(f"⬇️ Baixado: {filename}")
                            attachments_downloaded += 1
                        
                        print(f"🎉 Sucesso! {attachments_downloaded} arquivos atualizados.")
                        return True
                    else:
                        print("⚠️ Este email não contém arquivos Excel válidos. Tentando o próximo mais recente...")
        
        print("❌ Nenhum email com anexos Excel válidos encontrado nos últimos 5 dias.")
        return False

    except Exception as e:
        print(f"Erro durante processamento: {e}")
        return False
    finally:
        mail.close()
        mail.logout()

if __name__ == "__main__":
    download_daily_attachments()
