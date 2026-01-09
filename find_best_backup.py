import imaplib
import email
from email.header import decode_header
import os
import datetime
import toml

# Carrega credenciais do secrets.toml
# Carrega credenciais
try:
    import toml
    secrets_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".streamlit", "secrets.toml")
    secrets = toml.load(secrets_path)
    EMAIL_USER = secrets.get("GMAIL_USER", "gestao_mxm@grupohospitalcasa.com.br")
    EMAIL_PASS = secrets.get("GMAIL_APP_PASSWORD", "")
except Exception as e:
    print(f"Erro TOML: {e}")
    EMAIL_USER = "gestao_mxm@grupohospitalcasa.com.br"
    EMAIL_PASS = ""

# Manual fallback
if not EMAIL_PASS:
    try:
        secrets_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".streamlit", "secrets.toml")
        if os.path.exists(secrets_path):
            with open(secrets_path, "r", encoding="utf-8") as f:
                for line in f:
                    if "GMAIL_APP_PASSWORD" in line and "=" in line:
                        parts = line.split("=")
                        # Captura valor após o igual
                        val = parts[1].strip()
                        # Remove aspas apósto e asplas duplas das pontas
                        if (val.startswith("'") and val.endswith("'")) or (val.startswith('"') and val.endswith('"')):
                            val = val[1:-1]
                        EMAIL_PASS = val.strip().replace(" ", "")
                        print("Senha carregada via parser manual.")
    except Exception as e2:
        print(f"Erro parser manual: {e2}")

print(f"User: {EMAIL_USER}")
print(f"Pass Length: {len(EMAIL_PASS)}")
if len(EMAIL_PASS) > 4:
    print(f"Pass Start: {EMAIL_PASS[:2]}...{EMAIL_PASS[-2:]}")
else:
    print("Pass: [EMPTY/SHORT]")

SUBJECT_TAG = "[SYSTEM_DB_CUMULATIVE_BACKUP]"

def list_backups():
    print(f"Conectando como {EMAIL_USER}...")
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(EMAIL_USER, EMAIL_PASS)
    mail.select("inbox")
    
    print(f"Buscando assuntos: {SUBJECT_TAG}")
    status, messages = mail.search(None, f'(FROM "{EMAIL_USER}" SUBJECT "{SUBJECT_TAG}")')
    
    if status != "OK" or not messages[0]:
        print("Nenhum backup encontrado.")
        return

    email_ids = messages[0].split()
    print(f"Encontrados {len(email_ids)} emails de backup.")
    
    backups = []
    
    # Verifica os últimos 20 emails
    for eid in reversed(email_ids[-20:]):
        status, data = mail.fetch(eid, "(RFC822)")
        raw_email = data[0][1]
        msg = email.message_from_bytes(raw_email)
        
        date_tuple = email.utils.parsedate_tz(msg['Date'])
        if date_tuple:
            local_date = datetime.datetime.fromtimestamp(email.utils.mktime_tz(date_tuple))
        else:
            local_date = "Unknown"
            
        # Procura anexo
        size = 0
        filename = "Unknown"
        for part in msg.walk():
            if part.get_content_maintype() == 'multipart': continue
            if part.get('Content-Disposition') is None: continue
            
            fname = part.get_filename()
            if fname and SUBJECT_TAG not in fname: # O nome do arquivo costuma ser cumulative_db.pkl.xz
                filename = fname
                payload = part.get_payload(decode=True)
                if payload:
                    size = len(payload)
                    
        print(f"ID: {eid.decode()} | Data: {local_date} | Arquivo: {filename} | Tamanho: {size/1024:.2f} KB")
        backups.append({'id': eid.decode(), 'date': local_date, 'size': size})

    mail.close()
    mail.logout()

if __name__ == "__main__":
    list_backups()
