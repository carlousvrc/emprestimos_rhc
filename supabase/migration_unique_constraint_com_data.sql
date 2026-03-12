-- =============================================================================
-- MIGRAÇÃO: Adicionar data_transferencia à constraint única de itens_clinicos
-- =============================================================================
-- PROBLEMA: A constraint atual é (documento, unidade_origem, unidade_destino,
-- produto_saida). Hospitais diferentes têm sistemas próprios e podem emitir
-- o mesmo número de documento em meses diferentes para empréstimos distintos.
-- Sem a data na chave, o registro de fevereiro seria sobrescrito pelo de março.
--
-- SOLUÇÃO: Incluir data_transferencia na chave única. Assim:
--   • Mesmo doc no mesmo dia → UPSERT atualiza status (comportamento correto)
--   • Mesmo doc em mês diferente → INSERT novo registro (histórico preservado)
-- =============================================================================

-- PASSO 1: Descubra o nome da constraint atual (execute apenas para consulta)
SELECT conname AS nome_constraint, pg_get_constraintdef(oid) AS definicao
FROM pg_constraint
WHERE conrelid = 'itens_clinicos'::regclass
  AND contype = 'u';

-- ⚠️  Anote o valor de "nome_constraint" retornado acima e use no PASSO 2.
-- O nome gerado automaticamente costuma ser algo como:
--   itens_clinicos_documento_unidade_origem_unidade_destino_prod_key

-- =============================================================================
-- PASSO 2: Remova a constraint antiga (substitua o nome pelo que encontrou acima)
-- =============================================================================
ALTER TABLE itens_clinicos
  DROP CONSTRAINT IF EXISTS itens_clinicos_documento_unidade_origem_unidade_destino_prod_key;

-- Se o nome for diferente, use:
-- ALTER TABLE itens_clinicos DROP CONSTRAINT IF EXISTS <nome_encontrado_no_passo_1>;

-- =============================================================================
-- PASSO 3: Crie a nova constraint com data_transferencia
-- =============================================================================
ALTER TABLE itens_clinicos
  ADD CONSTRAINT itens_clinicos_unico_por_documento_e_data
  UNIQUE (documento, unidade_origem, unidade_destino, produto_saida, data_transferencia);

-- =============================================================================
-- VERIFICAÇÃO (execute após os passos acima)
-- =============================================================================
SELECT conname AS constraint, pg_get_constraintdef(oid) AS definicao
FROM pg_constraint
WHERE conrelid = 'itens_clinicos'::regclass
  AND contype = 'u';
-- Deve mostrar apenas: itens_clinicos_unico_por_documento_e_data
-- com a definição: UNIQUE (documento, unidade_origem, unidade_destino, produto_saida, data_transferencia)
