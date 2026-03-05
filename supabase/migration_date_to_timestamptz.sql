-- =============================================================================
-- MIGRAÇÃO: Alterar data_transferencia e data_recebimento de date para timestamptz
-- =============================================================================
-- PROBLEMA: As colunas são do tipo date e armazenam apenas a data (sem hora).
-- Para calcular o tempo de recebimento (horas entre saída e entrada), precisamos
-- do horário completo.
--
-- SOLUÇÃO: Alterar o tipo das colunas para timestamptz. Dados existentes (apenas
-- data) serão convertidos automaticamente para meia-noite UTC.
-- =============================================================================

-- PASSO 1: Alterar data_transferencia
ALTER TABLE itens_clinicos
  ALTER COLUMN data_transferencia TYPE timestamptz
  USING data_transferencia::timestamptz;

-- PASSO 2: Alterar data_recebimento
ALTER TABLE itens_clinicos
  ALTER COLUMN data_recebimento TYPE timestamptz
  USING data_recebimento::timestamptz;

-- =============================================================================
-- VERIFICAÇÃO (execute após os passos acima)
-- =============================================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'itens_clinicos'
  AND column_name IN ('data_transferencia', 'data_recebimento');
-- Deve mostrar: timestamptz para ambas as colunas
