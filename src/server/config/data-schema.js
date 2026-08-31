module.exports = {
  ignoredSheets: ["Eventos (D)"],
  sheets: {
    itau: { names: ["Itaú", "Itau"], account: "Itaú", columns: { date: ["Liquidacao", "Liquidação"], party: ["Fornecedor/Cliente"], history: ["Historico", "Histórico"], description: ["Descricao", "Descrição"], nature: ["Natureza"], value: ["Valor"], event: ["Evento"] } },
    card: { names: ["Cartão", "Cartao"], account: "Cartão", columns: { date: ["Liquidação", "Liquidacao"], emission: ["Emissão", "Emissao"], party: ["Fornecedor/Cliente"], history: ["Histórico", "Historico"], description: ["Descrição", "Descricao"], nature: ["Natureza"], value: ["Valor"], event: ["Evento"] } },
    cash: { names: ["Caixa (PF)", "Caixa"], account: "Caixa", columns: { date: ["Liquidação", "Liquidacao"], party: ["Fornecedor/Cliente"], history: ["Histórico", "Historico"], description: ["Descricao", "Descrição"], nature: ["Natureza"], value: ["Valor"], event: ["Evento"] } },
    redeSales: { names: ["Rede (V)"], account: "Rede", columns: { date: ["data da venda"], status: ["status da venda"], gross: ["valor da venda atualizado", "valor da venda original"], modality: ["modalidade"], brand: ["bandeira"], mdr: ["valor MDR"], net: ["valor líquido"], event: ["Evento"], machine: ["código da maquininha"] } },
    redeReceipts: { names: ["Rede (R)"], account: "Rede", columns: { date: ["data do recebimento"], value: ["valor líquido da parcela"], event: ["Evento"] } },
    eventSales: { names: ["Eventos (V)"], account: "Eventos", columns: { date: ["Data"], event: ["Evento"], value: ["Total geral"], party: ["Evento"], history: ["Observação", "Arquivo fonte"] } },
    pagarme: { names: ["Pagarme"], account: "Pagarme", columns: { date: ["Data"], party: ["Razão Social"], history: ["Lançamento"], value: ["Valor (R$)"], event: ["Evento"] } },
    nature: { names: ["#"], columns: { nature: ["Naturezas"] } }
  },
  defaults: { movementNatures: ["Transferência entre contas", "Aplicação em investimentos", "Resgate de investimentos", "Entrada da proprietária", "Retirada da proprietária"] }
};
