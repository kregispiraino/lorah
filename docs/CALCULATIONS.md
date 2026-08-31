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
- `Eventos (V)` é usado como fonte de faturamento por evento.
- Receita do evento = coluna `Total geral`.
- Sem filtro de evento, essa receita não entra na DRE/Visão Geral, evitando duplicidade com Rede/Pagarme.
- Com evento selecionado, essa receita substitui as receitas normais na DRE/Visão Geral.
- Despesas continuam vindo das abas financeiras principais pelo campo `Evento`.
- `Eventos (D)` continua ignorada.
- Na página Eventos, os dados podem ser exibidos para todos os eventos ou para um evento individual; filtros de Conta, Natureza e Fornecedor não removem a receita de `Eventos (V)` dessa página.


## Lançamentos sem Natureza
Lançamentos financeiros das abas Itaú, Cartão e Caixa não são descartados quando a Natureza estiver vazia:
- valor positivo → `Receita sem natureza`, seção RECEITA;
- valor negativo → `Despesa sem natureza`, seção CUSTO INDIRETO.

Essas naturezas entram normalmente nos filtros, DRE, indicadores e detalhamentos.
