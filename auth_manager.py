
import json
import os
import remote_persistence
import streamlit as st

USERS_FILE = "users.json"
_initial_sync_done = False

def load_users():
    """Carrega usuários do arquivo local."""
    ensure_sync() # Garante que tentou baixar da nuvem antes
    
    if not os.path.exists(USERS_FILE):
        return {}
        
    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erro ao ler users.json: {e}")
        return {}

def save_users(users):
    """Salva usuários e sincroniza com a nuvem."""
    try:
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=4, ensure_ascii=False)
        # Trigger cloud sync on save
        # Nota: auth_manager geralmente não especifica TAG, usa o default do remote_persistence (DB_SUBJECT_TAG)
        remote_persistence.sync_up()
        return True
    except Exception as e:
        print(f"Erro ao salvar users: {e}")
        return False

def ensure_sync():
    """Baixa o arquivo de usuários da nuvem na primeira execução."""
    global _initial_sync_done
    if not _initial_sync_done:
        print("☁️ [Auth] Buscando banco de dados de usuários na nuvem...")
        # sync_down sem argumentos traz o arquivo padrão (que deve ser o users.json ou database zipado)
        # Se remote_persistence estiver configurado para baixar o banco principal, precisamos ver como ele sabe que é o users.
        # Assumindo que o default do sync_down traz o que precisamos ou atualiza o diretório.
        
        # Correção based nas learnings: 
        # remote_persistence.sync_down() baixa o backup padrao
        if remote_persistence.sync_down():
            print("☁️ [Auth] Banco atualizado da nuvem.")
        _initial_sync_done = True

def check_password(username, password):
    users = load_users()
    if username in users and users[username]['password'] == password:
        return users[username].get('role', 'user')
    return None
