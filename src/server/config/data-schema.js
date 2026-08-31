module.exports = {
  ignoredSheets: ["Eventos (V)X"],
  sheets: {
    itau: { names: ["Itaú", "Itau"], account: "Itaú", columns: { date: ["Liquidacao", "Liquidação"], party: ["Fornecedor/Cliente"], history: ["Historico", "Histórico"], description: ["Descricao", "Descrição"], nature: ["Natureza"], value: ["Valor"] } },
    card: { names: ["Cartão", "Cartao"], account: "Cartão", columns: { date: ["Liquidação", "Liquidacao"], emission: ["Emissão", "Emissao"], party: ["Fornecedor/Cliente"], history: ["Histórico", "Historico"], description: ["Descrição", "Descricao"], nature: ["Natureza"], value: ["Valor"] } },
    cash: { names: ["Caixa (PF)", "Caixa"], account: "Caixa", columns: { date: ["Liquidação", "Liquidacao"], party: ["Fornecedor/Cliente"], history: ["Histórico", "Historico"], description: ["Descricao", "Descrição"], nature: ["Natureza"], value: ["Valor"] } },
    redeSales: { names: ["Rede (V)"], account: "Rede", columns: { date: ["data da venda"], status: ["status da venda"], gross: ["valor da venda atualizado", "valor da venda original"], modality: ["modalidade"], brand: ["bandeira"], mdr: ["valor MDR"], net: ["valor líquido"], machine: ["código da maquininha"] } },
    redeReceipts: { names: ["Rede (R)"], account: "Rede", columns: { date: ["data do recebimento"], value: ["valor líquido da parcela"] } },
    eventSales: { names: ["Eventos (V)"], account: "Eventos", columns: { order: ["Pedido"], date: ["Data do pedido"], event: ["Nome do evento"], gross: ["Total"], discount: ["Desconto"], value: ["Valor final"], history: ["Observação"] } },
    eventExpenses: { names: ["Eventos (D)"], account: "Eventos", columns: { event: ["Evento"], date: ["Liquidação", "Liquidacao"], party: ["Fornecedor/Cliente"], history: ["Histórico", "Historico"], value: ["Valor"], origin: ["Origem/Meio"], file: ["Arquivo fonte"] } },
    pagarme: { names: ["Pagarme"], account: "Pagarme", columns: { date: ["Data"], party: ["Razão Social"], history: ["Lançamento"], value: ["Valor (R$)"] } },
    nature: { names: ["#"], columns: { nature: ["Naturezas"] } }
  },
  defaults: { movementNatures: ["Transferência entre contas", "Aplicação em investimentos", "Resgate de investimentos", "Entrada da proprietária", "Retirada da proprietária"] }
};
