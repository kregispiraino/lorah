# Arquitetura do Dashboard Lorah

## Fluxo

```text
Browser autenticado → Express → DatasetService → ExcelParser/Normalizer
                              ↘ DatasetRepository → MySQL
                              ↘ FileStorage → Volume persistente
```

## Backend

- `src/server/config/data-schema.js`: aliases de abas e colunas.
- `src/server/services/excel-parser.js`: leitura e validação estrutural do Excel.
- `src/server/services/normalizer.js`: transformação para o modelo comum.
- `src/server/services/dataset-service.js`: coordena importação e ativação.
- `src/server/storage/file-storage.js`: adaptador isolado de storage.
- `src/server/repositories/*`: único lugar com SQL de domínio.
- `src/server/auth/*`: persistência das sessões opacas no MySQL.

## Frontend

- `src/client/js/data/storage.js`: cliente HTTP; não persiste dados financeiros no browser.
- `src/client/js/analytics/*`: filtros, DRE, agregações, rankings e Eventos.
- `src/client/js/pages/*`: apresentação das páginas.
- `src/client/js/ui/*`: componentes visuais e estado de filtros.

Excel original e JSON normalizado nunca são expostos como arquivos estáticos. A API entrega o dataset somente após validar a sessão.
