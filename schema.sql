-- Tabela de Usuários (Substitui users.json)
CREATE TABLE IF NOT EXISTS users_app (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'unidade',
    unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Histórico de Análises (Substitui cumulative_db.pkl)
CREATE TABLE IF NOT EXISTS analises_historico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_saida TIMESTAMP WITH TIME ZONE,
    unidade_origem TEXT,
    unidade_destino TEXT,
    documento TEXT,
    produto_saida TEXT,
    produto_entrada TEXT,
    especie TEXT,
    valor_saida NUMERIC(15, 2),
    valor_entrada NUMERIC(15, 2),
    diferenca NUMERIC(15, 2),
    status TEXT,
    tipo_divergencia TEXT,
    qualidade_match TEXT,
    observacoes TEXT,
    detalhes_produto TEXT,
    -- Metadados de controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    import_batch_id TEXT -- Para rastrear imports em lote
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analises_data ON analises_historico(data_saida);
CREATE INDEX IF NOT EXISTS idx_analises_status ON analises_historico(status);
CREATE INDEX IF NOT EXISTS idx_analises_origem ON analises_historico(unidade_origem);
CREATE INDEX IF NOT EXISTS idx_analises_destino ON analises_historico(unidade_destino);

-- Políticas RLS (Row Level Security) - Opcional por enquanto, mas recomendado
ALTER TABLE users_app ENABLE ROW LEVEL SECURITY;
ALTER TABLE analises_historico ENABLE ROW LEVEL SECURITY;

-- Política simples: Permite tudo para anon (já que estamos usando API Key no backend)
-- Na prática, deveríamos restringir, mas como o app roda local com a chave, ok.
CREATE POLICY "Allow All Access" ON users_app FOR ALL USING (true);
CREATE POLICY "Allow All Access" ON analises_historico FOR ALL USING (true);
