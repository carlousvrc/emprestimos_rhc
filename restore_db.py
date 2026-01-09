import os
import remote_persistence
import sys

def restore():
    print("Iniciando diagnóstico e restauração...")
    
    # 1. Verifica/Cria diretório dados
    dados_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dados")
    if not os.path.exists(dados_dir):
        print(f"Diretório 'dados' não encontrado. Criando: {dados_dir}")
        os.makedirs(dados_dir, exist_ok=True)
    else:
        print(f"Diretório 'dados' existe: {dados_dir}")

    # 2. Tenta Sync Down
    db_path = remote_persistence.CUMULATIVE_DB_FILE
    print(f"Tentando baixar DB para: {db_path}")
    print(f"Tag usada: {remote_persistence.CUMULATIVE_TAG}")
    
    success, msg = remote_persistence.sync_down(db_path, remote_persistence.CUMULATIVE_TAG)
    
    if success:
        print("✅ SUCESSO! Banco de dados restaurado da nuvem.")
        if os.path.exists(db_path):
             size = os.path.getsize(db_path)
             print(f"Tamanho do arquivo: {size/1024:.2f} KB")
    else:
        print(f"❌ FALHA no download: {msg}")
        # Tenta verificar credenciais
        user, pwd = remote_persistence.get_credentials()
        print(f"User: {user}")
        print(f"Password definida? {'Sim' if pwd else 'Não'}")

if __name__ == "__main__":
    restore()
