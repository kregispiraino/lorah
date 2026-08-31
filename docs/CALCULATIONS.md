# Regras de cálculo

## Valores do Excel

Células numéricas são lidas pelo valor bruto armazenado no XLSX, nunca pelo texto formatado. Isso evita que formatos como `128,726.25` sejam confundidos com `128,72625` por causa do locale.

## Regra central
Naturezas da seção `***___MOVIMENTAÇÃO___***` nunca entram como receita, despesa ou resultado.

## Itaú / Cartão / Caixa
O sinal e a Natureza do lançamento são respeitados.
- Receita: seção RECEITA.
- Custo direto: seção CUSTO DIRETO.
- Custo indireto: seção CUSTO INDIRETO.
- Movimentação: excluída da DRE.

No Cartão, a data principal da DRE é `Liquidação` (data de pagamento). A `Emissão` é preservada no modelo para futuras visões por competência.

## Rede (V)
- Somente `status da venda = aprovada`.
- Receita = valor bruto (`valor da venda atualizado`, fallback para original).
- MDR = despesa em `Tarifas bancárias`.
- Valor líquido é preservado como informação auxiliar.

## Rede (R)
É tratado como liquidação/movimentação e não gera nova receita, evitando duplicar a venda já registrada em Rede (V).

## Pagarme
Na estrutura atual, o valor da aba Pagarme é tratado como Receita de vendas.

## DRE
Resultado = Receitas + Custos diretos + Custos indiretos.
Como despesas estão negativas, a soma produz o resultado líquido.

## Eventos
- A página Eventos usa exclusivamente `Eventos (V)` e `Eventos (D)`.
- Receita do evento = `Valor final` de `Eventos (V)`; data = `Data do pedido`; evento = `Nome do evento`.
- Despesa do evento = `Valor` de `Eventos (D)`; data = `Liquidação`; o valor é normalizado como saída.
- Visão Geral e DRE ignoram completamente as duas abas de eventos e não oferecem filtro por evento.
- O filtro da página Eventos alterna entre o consolidado de todos os eventos e um evento individual.
- `Eventos (V)X` é apenas a referência do formato antigo e é ignorada.


## Lançamentos sem Natureza
Lançamentos financeiros das abas Itaú, Cartão e Caixa não são descartados quando a Natureza estiver vazia:
- valor positivo → `Receita sem natureza`, seção RECEITA;
- valor negativo → `Despesa sem natureza`, seção CUSTO INDIRETO.

Essas naturezas entram normalmente nos filtros, DRE, indicadores e detalhamentos.
