import imaplib
import email
import os
import datetime
import toml
import lzma

# --- Configuração ---
TARGET_FILE = os.path.join("dados", "cumulative_db.pkl")
SUBJECT_TAG = "[SYSTEM_DB_CUMULATIVE_BACKUP]"

# Carrega credenciais
try:
    secrets_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".streamlit", "secrets.toml")
    secrets = toml.load(secrets_path)
    EMAIL_USER = secrets.get("GMAIL_USER", "gestao_mxm@grupohospitalcasa.com.br")
    EMAIL_PASS = secrets.get("GMAIL_APP_PASSWORD", "").replace(" ", "")
except:
    EMAIL_USER = "gestao_mxm@grupohospitalcasa.com.br"
    EMAIL_PASS = ""

# Manual fallback
if not EMAIL_PASS or len(EMAIL_PASS) < 5:
    try:
        secrets_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".streamlit", "secrets.toml")
        if os.path.exists(secrets_path):
            with open(secrets_path, "r", encoding="utf-8") as f:
                for line in f:
                    if "GMAIL_APP_PASSWORD" in line and "=" in line:
                        parts = line.split("=")
                        val = parts[1].strip()
                        if (val.startswith("'") and val.endswith("'")) or (val.startswith('"') and val.endswith('"')):
                            val = val[1:-1]
                        EMAIL_PASS = val.strip().replace(" ", "")
    except:
        pass

def restore_largest():
    print(f"Conectando como {EMAIL_USER}...")
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(EMAIL_USER, EMAIL_PASS)
    mail.select("inbox")
    
    print(f"Buscando backups: {SUBJECT_TAG}")
    status, messages = mail.search(None, f'(FROM "{EMAIL_USER}" SUBJECT "{SUBJECT_TAG}")')
    
    if status != "OK" or not messages[0]:
        print("Nenhum backup encontrado.")
        return

    email_ids = messages[0].split()
    print(f"Analisando {len(email_ids)} emails (max 30)...")
    
    candidates = []
    
    # Verifica os últimos 30 emails
    for eid in reversed(email_ids[-30:]):
        try:
            status, data = mail.fetch(eid, "(RFC822)")
            raw_email = data[0][1]
            msg = email.message_from_bytes(raw_email)
            
            # Procura anexo
            for part in msg.walk():
                if part.get_content_maintype() == 'multipart': continue
                if part.get('Content-Disposition') is None: continue
                
                fname = part.get_filename() or ""
                # O arquivo geralmente é cumulative_db.pkl.xz
                if "cumulative" in fname or ".xz" in fname or ".pkl" in fname:
                    payload = part.get_payload(decode=True)
                    if payload:
                        size = len(payload)
                        candidates.append({
                            'id': eid,
                            'filename': fname,
                            'size': size,
                            'payload': payload,
                            'date': msg['Date']
                        })
                        # print(f"Candidato: {fname} | Size: {size/1024:.2f} KB | ID: {eid.decode()}")
        except Exception as e:
            print(f"Erro ao ler email {eid}: {e}")

    mail.close()
    mail.logout()
    
    if not candidates:
        print("Nenhum anexo válido encontrado.")
        return

    # Encontra o maior
    best = max(candidates, key=lambda x: x['size'])
    print(f"\n🏆 MELHOR BACKUP ENCONTRADO:")
    print(f"   Arquivo: {best['filename']}")
    print(f"   Tamanho: {best['size']/1024:.2f} KB")
    print(f"   Data: {best['date']}")
    
    # Restaura
    os.makedirs(os.path.dirname(TARGET_FILE), exist_ok=True)
    
    try:
        final_payload = best['payload']
        # Se for .xz e o target não for .xz, descomprime
        if best['filename'].endswith('.xz') and not TARGET_FILE.endswith('.xz'):
            print("   Descomprimindo lzma...")
            final_payload = lzma.decompress(best['payload'])
            
        with open(TARGET_FILE, 'wb') as f:
            f.write(final_payload)
            
        print(f"✅ SUCESSO! Arquivo restaurado em: {TARGET_FILE}")
        print(f"   Tamanho Final: {os.path.getsize(TARGET_FILE)/1024:.2f} KB")
        
    except Exception as e:
        print(f"❌ Erro ao salvar/descomprimir: {e}")

if __name__ == "__main__":
    restore_largest()
