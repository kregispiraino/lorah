# Lorah — Dashboard Financeiro

Aplicação full-stack do dashboard financeiro da Lorah. O frontend original foi preservado (layout, temas, páginas, filtros, drill-downs e navegação responsiva), enquanto autenticação, importação e persistência passaram para um backend Node.js.

## Arquitetura

```text
src/
  client/                 frontend modular existente + tela de login
    assets/
    js/analytics/         cálculos de Visão Geral, DRE e Eventos
    js/data/              cliente da API de datasets
    js/pages/             apresentação das páginas
    js/ui/                componentes e filtros
  server/
    auth/                 store de sessão MySQL
    config/               ambiente e schema da planilha
    controllers/          adaptadores HTTP
    database/             pool MySQL
    middleware/           autenticação, upload e erros
    repositories/         SQL parametrizado
    routes/               rotas HTTP
    services/             autenticação, parser, normalização e datasets
    storage/              adaptador de arquivos persistentes
migrations/               schema versionado do MySQL
scripts/                  migration e seed
storage/                  dados locais ignorados pelo Git
tests/                    testes de integração e regras financeiras
docs/                     arquitetura, modelo e cálculos
```

O Excel permanece como fonte financeira. O MySQL guarda usuários, sessões e metadados das importações. O arquivo original e um cache JSON normalizado são privados no filesystem persistente. A classe `FileStorage` isola essa implementação para permitir futura troca por S3, R2 ou outro object storage.

## Requisitos

- Node.js 20 ou superior;
- MySQL 8 ou superior;
- npm;
- Docker e Docker Compose são opcionais.

## Configuração local

```bash
npm install
cp .env.example .env
```

Configure `.env` sem versioná-lo:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://lorah:lorah@127.0.0.1:3306/lorah
SESSION_SECRET=gere-um-segredo-aleatorio-com-ao-menos-32-caracteres
DATA_STORAGE_PATH=./storage
INITIAL_ADMIN_EMAIL=financeiro@plexholding.com.br
INITIAL_ADMIN_PASSWORD=defina-uma-senha-inicial-segura
TRUST_PROXY=1
MAX_UPLOAD_MB=25
```

Para iniciar somente o MySQL com Docker:

```bash
docker compose up -d mysql
```

Prepare banco e usuário inicial:

```bash
npm run migrate
npm run seed
```

O seed usa `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`, gera um hash bcrypt com custo 12 e grava somente esse hash. A API nunca retorna `password_hash`. Remova `INITIAL_ADMIN_PASSWORD` do ambiente depois do primeiro seed.

Inicie a aplicação:

```bash
npm run dev
```

Para simular produção localmente:

```bash
npm start
```

Acesse `http://localhost:3000`. O servidor escuta em `0.0.0.0` e respeita `PORT`.

## Autenticação e segurança

- sessão opaca persistida no MySQL, sem token em `localStorage`;
- cookie `HttpOnly`, `SameSite=Lax`, duração móvel de sete dias e `Secure` em produção;
- regeneração do ID no login e destruição real da sessão no logout;
- dashboard, assets internos e APIs financeiras protegidos;
- bcrypt, Helmet/CSP, limite de tentativas no login e erros centralizados;
- upload limitado (25 MB por padrão), uma planilha por requisição, extensão e MIME validados;
- nomes de arquivos gerados com UUID; o nome do usuário nunca compõe um caminho;
- SQL concentrado em repositories e sempre parametrizado;
- variáveis sensíveis apenas no ambiente.

## Importação e persistência

1. Um administrador autenticado escolhe `.xlsx` ou `.xls` em **Importar dados** (a opção continua oculta no mobile).
2. O backend recebe o arquivo em uma área temporária privada.
3. O parser valida a estrutura mínima e lê o valor numérico bruto das células, sem depender da formatação regional exibida pelo Excel.
4. `Eventos (D)` é descartada; as demais abas são normalizadas pelas regras em [docs/CALCULATIONS.md](docs/CALCULATIONS.md).
5. O arquivo original e o JSON são escritos com nomes únicos e renomeados atomicamente.
6. Só depois do sucesso no storage uma transação MySQL marca a nova base como ativa. Se parsing, escrita ou banco falharem, a base anterior continua ativa.
7. A aplicação lê a última base ativa em cada navegador/dispositivo e mostra discretamente arquivo e horário da atualização.

Arquivos antigos são mantidos como histórico físico e metadados inativos. Defina uma política de retenção/backup antes de automatizar sua remoção.

## Regras financeiras preservadas

- `Eventos (D)` é ignorada.
- `Eventos (V)` fornece faturamento por evento.
- Sem filtro de evento, DRE e Visão Geral usam as receitas normais da empresa e excluem `Eventos (V)`.
- Com evento selecionado, DRE e Visão Geral usam somente a receita de `Eventos (V)` daquele evento; despesas vêm dos lançamentos vinculados.
- MOVIMENTAÇÃO nunca entra como receita, despesa ou resultado.
- Receita sem natureza vira `Receita sem natureza`; despesa sem natureza vira `Despesa sem natureza` em Custo Indireto.
- Rede (V), Rede (R), Pagarme, Itaú, Cartão e Caixa seguem [docs/CALCULATIONS.md](docs/CALCULATIONS.md).

Durante a profissionalização foi identificada uma inconsistência: a documentação e a regra solicitada determinavam substituir receitas normais por `Eventos (V)` quando havia filtro, mas a implementação anterior podia somar ambas. O comportamento foi alinhado à regra documentada para impedir duplicidade.

## Testes

```bash
npm test
npm audit
```

Os testes cobrem login válido e inválido, sessão/rota protegida, importação sem autenticação, parser XLSX, normalizador, MOVIMENTAÇÃO, naturezas vazias e receita de `Eventos (V)` com filtro.

## Docker

```bash
docker build -t lorah-dashboard .
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL='mysql://usuario:senha@host:3306/banco' \
  -e SESSION_SECRET='segredo-aleatorio-de-pelo-menos-32-caracteres' \
  -e DATA_STORAGE_PATH=/data \
  -v lorah_data:/data \
  lorah-dashboard
```

Execute `npm run migrate` e `npm run seed` contra o mesmo banco antes do primeiro start.

## Publicação no Railway (preparação; nenhuma ação no painel foi feita)

O arquivo `railway.json` seleciona o Dockerfile, executa migrations no pre-deploy, usa `npm start` e configura `/health`. O Railway injeta `PORT`; não é necessário defini-la manualmente.

### 1. Serviços e banco

1. Crie um projeto e conecte este repositório GitHub como serviço web.
2. No mesmo projeto, use **New → Database → MySQL**.
3. No serviço web, crie `DATABASE_URL` como reference variable para `${{MySQL.MYSQL_URL}}` (ajuste `MySQL` se o serviço tiver outro nome). O banco fica acessível pela rede privada; não habilite TCP público sem necessidade.

O serviço MySQL do Railway expõe `MYSQL_URL` e as variáveis individuais de conexão. Consulte a [documentação oficial do MySQL no Railway](https://docs.railway.com/databases/mysql).

### 2. Volume do Excel

1. Anexe um Volume ao serviço web.
2. Use o mount path `/app/storage`.
3. Defina `DATA_STORAGE_PATH=/app/storage`.
4. Ative backups manuais e uma agenda adequada. O entrypoint ajusta somente a permissão desse diretório e então inicia o Node como usuário não-root.

Mantenha uma única réplica do serviço web enquanto `FileStorage`/Volume estiver em uso. Escala horizontal deve vir junto da futura migração para object storage compartilhado.

Volumes só existem em runtime, não no build/pre-deploy. Veja [Volumes](https://docs.railway.com/volumes) e [Backups](https://docs.railway.com/volumes/backups).

### 3. Variáveis do serviço web

```dotenv
NODE_ENV=production
DATABASE_URL=${{MySQL.MYSQL_URL}}
SESSION_SECRET=<segredo aleatório forte, mínimo 32 caracteres>
DATA_STORAGE_PATH=/app/storage
INITIAL_ADMIN_EMAIL=financeiro@plexholding.com.br
INITIAL_ADMIN_PASSWORD=<somente no primeiro deploy>
TRUST_PROXY=1
MAX_UPLOAD_MB=25
```

Sele `SESSION_SECRET` no painel. No primeiro deploy, o pre-deploy executará migration e seed porque `INITIAL_ADMIN_PASSWORD` estará preenchida. Depois que o login for validado, exclua `INITIAL_ADMIN_PASSWORD`; deploys seguintes executarão apenas migrations. Nunca reutilize a senha inicial como senha permanente.

### 4. Healthcheck e domínio

1. Confirme em **Settings → Deploy → Healthcheck Path** o valor `/health` (também está em `railway.json`).
2. Em **Settings → Networking**, gere primeiro um domínio `*.up.railway.app` e valide login/importação.
3. Para domínio próprio, escolha **+ Custom Domain** e crie no provedor DNS os registros CNAME e TXT exibidos pelo Railway. Ambos são necessários; o SSL é emitido automaticamente após a validação.

Referências: [Healthchecks](https://docs.railway.com/deployments/healthchecks) e [Custom Domains](https://docs.railway.com/networking/domains/working-with-domains).

### 5. Checklist pós-deploy

- `/health` retorna `200`;
- login funciona e a senha inicial foi retirada das variáveis;
- importação de uma base autorizada conclui;
- logout invalida a sessão;
- a base reaparece em sessão anônima/navegador diferente após novo login;
- reiniciar/redeployar não remove os dados do Volume;
- backups de MySQL e Volume estão habilitados;
- o domínio próprio responde em HTTPS.

## Dados e Git

O repositório contém somente código e testes com valores fictícios. `.gitignore` e `.dockerignore` excluem planilhas, storage, uploads, dumps, logs, caches e `.env`. Nenhum dataset financeiro real deve ser adicionado, nem mesmo para depuração.
