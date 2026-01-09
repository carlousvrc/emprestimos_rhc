import smtplib
import imaplib
import email
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
import os
import datetime
import json

# Configurações do "Banco de Dados" via Email
DB_SUBJECT_TAG = "[SYSTEM_DB_USERS_BACKUP]"
# Configurações do "Banco de Dados" via Email
DB_SUBJECT_TAG = "[SYSTEM_DB_USERS_BACKUP]"
CUMULATIVE_TAG = "[SYSTEM_DB_CUMULATIVE_BACKUP]"
LOCAL_DB_FILE = "users.json"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CUMULATIVE_DB_FILE = os.path.join(BASE_DIR, "dados", "cumulative_db.pkl")
BACKUP_FOLDER = "System_Backups"

# Credenciais (Pega as mesmas do download_gmail.py)
EMAIL_USER = "doc.analise.robo@gmail.com" 
EMAIL_PASS = os.getenv("GMAIL_APP_PASSWORD") 

def get_credentials():
    # Tenta pegar variáveis de ambiente ou Secrets do Streamlit
    import streamlit as st
    try:
        if "GMAIL_APP_PASSWORD" in st.secrets:
             return st.secrets["GMAIL_USER"], st.secrets["GMAIL_APP_PASSWORD"]
    except:
        pass

    user = os.getenv("GMAIL_USER", "gestao_mxm@grupohospitalcasa.com.br")
    password = os.getenv("GMAIL_APP_PASSWORD", "").replace(" ", "")
    return user, password

import lzma
import time

def sync_up(file_path=LOCAL_DB_FILE, subject_tag=DB_SUBJECT_TAG):
    """Envia um arquivo local para o email (Salva no IMAP sem enviar email). Com compressão."""
    
    if not os.path.exists(file_path):
        return False, f"Arquivo local não encontrado: {file_path}"
        
    user, password = get_credentials()
    if not user or not password:
        return False, "Credenciais de e-mail não encontradas."

    try:
        # Compressão
        file_to_send = file_path
        temp_compressed = None
        
        if file_path.endswith('.pkl'):
            temp_compressed = file_path + ".xz"
            with open(file_path, "rb") as f_in, lzma.open(temp_compressed, "wb") as f_out:
                f_out.write(f_in.read())
            file_to_send = temp_compressed
            print(f"📦 Arquivo comprimido: {os.path.getsize(file_to_send)/1024:.2f} KB")

        msg = MIMEMultipart()
        msg['From'] = user
        msg['To'] = user 
        msg['Subject'] = f"{subject_tag} {datetime.datetime.now().isoformat()}"
        
        body = f"Backup automático: {os.path.basename(file_path)}"
        msg.attach(MIMEText(body, 'plain'))
        
        with open(file_to_send, "rb") as attachment:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment.read())
        
        encoders.encode_base64(part)
        filename_only = os.path.basename(file_to_send)
        part.add_header('Content-Disposition', f"attachment; filename= {filename_only}")
        msg.attach(part)
        
        # Conecta IMAP
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(user, password)
        
        # Cria e usa pasta dedicada para não poluir Inbox
        try:
             mail.create(BACKUP_FOLDER)
        except:
             pass # Já existe
        
        # Salva na pasta BACKUP_FOLDER
        mail.append(BACKUP_FOLDER, '(\\Seen)', imaplib.Time2Internaldate(time.time()), msg.as_bytes())
        
        mail.logout()
        
        # Limpa temp
        if temp_compressed and os.path.exists(temp_compressed):
            os.remove(temp_compressed)
            
        print(f"✅ [Cloud Sync] Arquivo salvo em {BACKUP_FOLDER}: {filename_only}")
        return True, "Upload (Save) realizado com sucesso."
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ [Cloud Sync] Erro no upload: {error_msg}")
        return False, f"Erro no envio: {error_msg}"

def sync_down(target_file=LOCAL_DB_FILE, subject_tag=DB_SUBJECT_TAG):
    """Baixa a versão mais recente de um arquivo do email (Load Cloud). Suporta .xz"""
    user, password = get_credentials()
    if not user or not password:
        return False, "Credenciais não encontradas."
        
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(user, password)
        
        # Tenta selecionar pasta de Backup, se falhar vai pro Inbox (retrocompatibilidade)
        res = mail.select(BACKUP_FOLDER)
        if res[0] != 'OK':
            print(f"⚠️ Pasta {BACKUP_FOLDER} não encontrada. Buscando na INBOX...")
            mail.select("inbox")
        
        # Busca emails enviados por mim com o assunto específico
        status, messages = mail.search(None, f'(FROM "{user}" SUBJECT "{subject_tag}")')
        
        if status != "OK" or not messages[0]:
            # Se não achou na pasta de backup E estavamos nela, tenta Inbox agora
            if res[0] == 'OK': # Significa que olhamos na Backup folder
                 print("   Não encontrado na pasta de Backup. Tentando INBOX antigas...")
                 mail.select("inbox")
                 status, messages = mail.search(None, f'(FROM "{user}" SUBJECT "{subject_tag}")')

            if status != "OK" or not messages[0]:
                print(f"⚠️ [Cloud Sync] Nenhum backup encontrado na nuvem para {subject_tag}.")
                return False, "Nenhum backup encontrado."
            
        # Pega o último ID (mais recente)
        latest_email_id = messages[0].split()[-1]
        
        status, data = mail.fetch(latest_email_id, "(RFC822)")
        raw_email = data[0][1]
        msg = email.message_from_bytes(raw_email)
        
        found_attachment = False
        target_filename = os.path.basename(target_file)
        compressed_filename = target_filename + ".xz"
        
        for part in msg.walk():
            if part.get_content_maintype() == 'multipart':
                continue
            if part.get('Content-Disposition') is None:
                continue
                
            filename = part.get_filename() or ""
            filename = filename.strip()
            
            # Verifica se é o arquivo exato OU a versão comprimida
            is_match = (filename == target_filename)
            is_compressed = (filename == compressed_filename)
            
            if is_match or is_compressed:
                # Garante que diretório existe
                os.makedirs(os.path.dirname(os.path.abspath(target_file)), exist_ok=True)
                
                payload = part.get_payload(decode=True)
                
                if is_compressed:
                    try:
                        # Descomprime
                        payload = lzma.decompress(payload)
                        print(f"📦 Arquivo descomprimido com sucesso.")
                    except:
                        print("❌ Erro ao descomprimir. Usando raw.")
                
                with open(target_file, 'wb') as f:
                    f.write(payload)
                    
                found_attachment = True
                print(f"✅ [Cloud Sync] Arquivo {target_file} restaurado.")
                break
        
        mail.close()
        mail.logout()
        
        if found_attachment:
            return True, "Download concluído."
        else:
            return False, "Arquivo não encontrado no email recente."
        
    except Exception as e:
        print(f"❌ [Cloud Sync] Erro no download de {target_file}: {e}")
        return False, f"Erro no download: {e}"

if __name__ == "__main__":
    # Teste rápido se rodado direto
    print("Testando Sync...")
    # sync_up()
