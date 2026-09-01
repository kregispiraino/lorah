# Modelo normalizado

Cada linha relevante das abas é convertida para:
- `id`
- `date`
- `emissionDate` (quando disponível)
- `source`
- `account`
- `party`
- `history`
- `description`
- `nature`
- `section`: revenue | movement | direct | indirect | unclassified | eventRevenue | eventExpense
- `value`
- `event`
- `kind`

Registros `eventRevenue` e `eventExpense` são exclusivos da página Eventos. Os demais registros alimentam Visão Geral e DRE.

Campos específicos (como MDR, valor líquido e maquininha) podem ser mantidos sem alterar as páginas.

## Onde adaptar quando a base mudar
1. Ajuste aliases em `src/server/config/data-schema.js`.
2. Se a regra econômica mudar, ajuste `src/server/services/normalizer.js`.
3. Se o cálculo mudar, ajuste `src/client/js/analytics/*`.
4. Não coloque regra de negócio em `src/client/js/pages/*`.

## Metadados persistidos

O MySQL mantém apenas o metadado da base ativa: identificador, nome original, nomes privados no storage, SHA-256, quantidade de registros, usuário e data/hora. O Volume mantém somente o Excel ativo e seu cache JSON compactado; ambos são substituídos após cada importação bem-sucedida.
