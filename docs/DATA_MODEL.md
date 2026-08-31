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
- `section`: revenue | movement | direct | indirect | unclassified
- `value`
- `event`
- `kind`

Campos específicos (como MDR, valor líquido e maquininha) podem ser mantidos sem alterar as páginas.

## Onde adaptar quando a base mudar
1. Ajuste aliases em `src/server/config/data-schema.js`.
2. Se a regra econômica mudar, ajuste `src/server/services/normalizer.js`.
3. Se o cálculo mudar, ajuste `src/client/js/analytics/*`.
4. Não coloque regra de negócio em `src/client/js/pages/*`.

## Metadados persistidos

Cada importação registra no MySQL: identificador, nome original, nomes privados no storage, SHA-256, quantidade de registros, usuário, data/hora e estado ativo. O conteúdo dos lançamentos permanece no Excel/JSON do Volume nesta fase.
