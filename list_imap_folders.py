import imaplib
import os
import toml

# Carrega credenciais
try:
    secrets_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".streamlit", "secrets.toml")
    secrets = toml.load(secrets_path)
    EMAIL_USER = secrets.get("GMAIL_USER", "gestao_mxm@grupohospitalcasa.com.br")
    EMAIL_PASS = secrets.get("GMAIL_APP_PASSWORD", "").replace(" ", "")
except:
    EMAIL_USER = "gestao_mxm@grupohospitalcasa.com.br"
    EMAIL_PASS = os.environ.get("GMAIL_APP_PASSWORD", "")

def list_folders():
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(EMAIL_USER, EMAIL_PASS)
    
    print("Pastas disponíveis:")
    for folder in mail.list()[1]:
        print(folder.decode())
        
    mail.logout()

if __name__ == "__main__":
    list_folders()
