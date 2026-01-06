from supabase_client import supabase

def test_connection():
    print("Testando conexão com Supabase...")
    if not supabase:
        print("❌ Cliente Supabase falhou ao inicializar.")
        return

    try:
        # Tenta uma operação simples (não precisa trazer dados, só verificar auth/conexão)
        # Se a tabela não existir, vai dar erro, mas prova que conectou
        # Vamos tentar listar tabelas ou pegar auth user, ou apenas ver se o objeto existe
        print("Objeto supabase existe.")
        
        # Teste de Auth (Anon) - Verifica se a chave é válida
        # Geralmente não requer login
        print(f"URL Configurad: {supabase.supabase_url}")
        
        # Tenta um select simples numa tabela que vamos criar (mas ainda não existe)
        # O erro esperado é 404 ou 401 (se chave errada) ou "relation not found" (se chave certa)
        # Isso valida a conexão.
        try:
            response = supabase.table("non_existent_table").select("*").limit(1).execute()
            print(f"Resposta inesperada (tabela não deveria existir): {response}")
        except Exception as e:
            # Se der erro de "relation not found", conectou!
            # Se der erro de URL ou Key invalida, falhou.
            msg = str(e)
            if "relation" in msg and "does not exist" in msg:
                 print("✅ Conectado com sucesso! (Erro 'tabela não existe' é esperado e confirma acesso ao DB)")
            elif "401" in msg or "JWT" in msg:
                 print(f"❌ Erro de Autenticação (Chave Inválida?): {msg}")
            elif "404" in msg:
                 print(f"✅ Conectado com sucesso! (Erro 404 esperado para tabela inexistente)")
            else:
                 print(f"⚠️ Resposta do servidor (provavelmente conectado): {msg}")

    except Exception as e:
        print(f"❌ Erro fatal: {e}")

if __name__ == "__main__":
    test_connection()
