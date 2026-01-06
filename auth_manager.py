import hashlib
import binascii
import os
from supabase_client import supabase

# Mantendo a lógica de hash idêntica para compatibilidade
def hash_password(password):
    """Hash password using PBKDF2 with SHA256 and a random salt."""
    salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
    pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    pwdhash = binascii.hexlify(pwdhash)
    return (salt + pwdhash).decode('ascii')

def verify_password(stored_password, provided_password):
    """Verify a stored password against one provided by user"""
    try:
        salt = stored_password[:64]
        stored_hash = stored_password[64:]
        pwdhash = hashlib.pbkdf2_hmac('sha256', provided_password.encode('utf-8'), salt.encode('ascii'), 100000)
        pwdhash = binascii.hexlify(pwdhash).decode('ascii')
        return pwdhash == stored_hash
    except Exception as e:
        print(f"Erro ao verificar senha: {e}")
        return False

# --- Novas funções usando Supabase ---

def load_users():
    """
    Carrega todos os usuários do Supabase.
    Retorna um dicionário {username: {data}} para compatibilidade com o frontend.
    """
    try:
        response = supabase.table("users_app").select("*").execute()
        users_list = response.data
        
        users_dict = {}
        for u in users_list:
            users_dict[u['username']] = {
                'password': u['password_hash'], # Mapeia nome da coluna
                'name': u['name'],
                'role': u['role'],
                'unit': u['unit']
            }
        return users_dict
    except Exception as e:
        print(f"❌ Erro ao carregar usuários do Supabase: {e}")
        return {}

def create_user(username, password, name, role, unit=None):
    try:
        hashed = hash_password(password)
        data = {
            "username": username,
            "password_hash": hashed,
            "name": name,
            "role": role,
            "unit": unit
        }
        supabase.table("users_app").insert(data).execute()
        print(f"✅ Usuário {username} criado no Supabase.")
        return True
    except Exception as e:
        print(f"❌ Erro ao criar usuário: {e}")
        return False

def update_password(username, new_password):
    try:
        hashed = hash_password(new_password)
        supabase.table("users_app").update({"password_hash": hashed}).eq("username", username).execute()
        return True
    except Exception as e:
        print(f"❌ Erro ao atualizar senha: {e}")
        return False

def update_user_details(username, name=None, role=None, unit=None):
    try:
        updates = {}
        if name: updates["name"] = name
        if role: updates["role"] = role
        if unit is not None: updates["unit"] = unit
        
        if updates:
            supabase.table("users_app").update(updates).eq("username", username).execute()
        return True
    except Exception as e:
        print(f"❌ Erro ao atualizar detalhes: {e}")
        return False

def update_username(current_username, new_username):
    # Alterar PK no SQL é chato (violação de FK se tivesse).
    # Como não temos FK complexa ainda, podemos criar novo e deletar antigo.
    # Mas o ideal seria não permitir mudar username facilmente.
    # Vamos tentar clonar e deletar.
    try:
        users = load_users()
        if current_username in users:
            curr_data = users[current_username]
            # Cria novo
            create_user(new_username, "dummy", curr_data['name'], curr_data['role'], curr_data.get('unit'))
            # Atualiza hash da senha para o original (hacky mas funciona já que sabemos o hash)
            supabase.table("users_app").update({"password_hash": curr_data['password']}).eq("username", new_username).execute()
            # Deleta antigo
            delete_user(current_username)
            return True
    except Exception as e:
         print(f"Erro ao mudar username: {e}")
    return False

def delete_user(username):
    try:
        supabase.table("users_app").delete().eq("username", username).execute()
        return True
    except Exception as e:
        print(f"Erro ao deletar: {e}")
        return False
