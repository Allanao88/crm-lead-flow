# LeadFlow CRM

Aplicação web de CRM comercial e controle de estoque construída com **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS 4** e **Supabase** (Auth, Postgres, RLS e RPCs).

---

## Modelo de implantação e personalização por cliente

O **LeadFlow CRM** adota a estratégia de **uma instalação isolada por cliente**:
- **1 projeto Supabase dedicado por cliente:** isolamento total de banco de dados, storage, chaves e políticas de acesso (RLS).
- **1 projeto Vercel dedicado por cliente:** mesmo repositório e código-fonte, configurado via variáveis de ambiente injetadas no momento do build (Vite).
- **Código 100% agnóstico:** o repositório não contém dados, marcas, nomes, logotipos, e-mails ou cores atrelados a nenhum cliente real.

### Variáveis de ambiente de personalização

Todas as variáveis de marca são **opcionais** e contam com fallbacks defensivos — valores ausentes ou inválidos nunca quebram a aplicação.

| Variável | Tipo | Padrão | Regras de validação | Descrição |
| --- | --- | --- | --- | --- |
| `VITE_CLIENT_NAME` | `string` | `"Sua empresa"` | `trim()`, limite de 60 caracteres. Vazio ou espaços reverte ao padrão. | Nome da empresa exibido no título da aba (`document.title`), cabeçalhos, rodapé e sidebar. |
| `VITE_CLIENT_LOGO_URL` | `string` | `null` | Deve ser URL estritamente com protocolo `https://`. Inválidas são descartadas. | URL do logotipo da empresa. Se ausente ou falhar (`onError`), gera avatar com as iniciais do nome. |
| `VITE_BRAND_COLOR` | `string` | `#007a29` | Hex `#RRGGBB` (7 caracteres). Requer contraste mínimo de 4.5:1 (WCAG AA). | Cor primária da marca. Injeta dinamicamente botões, links, anéis de foco e clareamento para modo escuro. |
| `VITE_CONTACT_EMAIL` | `string` | `null` | Formato válido de e-mail (`usuario@dominio.com`). | E-mail de suporte institucional exibido com link `mailto:` no rodapé das telas e no login. |

### Configuração no Vercel (Novo cliente)

Para implantar uma nova instância de cliente:
1. No painel da Vercel, crie um novo projeto importando este repositório (`crm-lead-flow`).
2. Acesse **Project Settings > Environment Variables**.
3. Adicione as variáveis obrigatórias de conexão ao Supabase do cliente:
   - `VITE_SUPABASE_URL`: URL da instância Supabase do cliente.
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Chave pública `anon` / `publishable`.
4. Adicione as variáveis de marca do cliente:
   ```env
   VITE_CLIENT_NAME=Acme Indústria
   VITE_CLIENT_LOGO_URL=https://acme.com.br/logo.png
   VITE_BRAND_COLOR=#2563eb
   VITE_CONTACT_EMAIL=suporte@acme.com.br
   ```
5. Dispare o deploy. O Vite compilará a interface com as cores, logotipo e título específicos do cliente.

### Exemplo local (`.env.local`)

```dotenv
# Conexão Supabase
VITE_SUPABASE_URL=https://<seu-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<sua-publishable-key>

# Identidade visual do cliente (opcionais)
VITE_CLIENT_NAME=Cliente Exemplo
VITE_CLIENT_LOGO_URL=https://exemplo.com.br/logo.png
VITE_BRAND_COLOR=#2563eb
VITE_CONTACT_EMAIL=contato@exemplo.com.br
```

---

## Pré-requisitos

- **Node.js 22+** e **npm**
- Projeto **Supabase** configurado (ou CLI do Supabase para inspeção de migrations)

---

## Setup local

1. Clone o repositório e instale as dependências:

   ```bash
   git clone https://github.com/Allanao88/crm-lead-flow.git
   cd crm-lead-flow
   npm ci
   ```

2. Crie o arquivo `.env.local` na raiz do projeto (ignorado pelo Git) com as variáveis públicas do Supabase:

   ```dotenv
   VITE_SUPABASE_URL=https://<seu-project-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<sua-publishable-ou-anon-key>
   ```

   > **Importante:** utilize apenas a chave pública (`publishable` / `anon`) no frontend. Nunca exponha a `service_role` key em variáveis `VITE_*`.

3. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

---

## Scripts disponíveis

| Script | Comando | Descrição |
| --- | --- | --- |
| `npm run dev` | `vite` | Inicia o servidor local de desenvolvimento com HMR |
| `npm run build` | `tsc -b && vite build` | Checa tipos TypeScript e gera o bundle de produção em `dist/` |
| `npm run lint` | `eslint .` | Analisa o código com ESLint (TypeScript + React Hooks) |
| `npm test` | `vitest run` | Executa a suíte de testes automatizados (Vitest + Testing Library) |
| `npm run preview` | `vite preview` | Serve localmente o build gerado em `dist/` |

---

## Estrutura de pastas

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml                  # Pipeline de CI (lint, build e testes em Node 22)
├── public/                         # Arquivos estáticos públicos
├── src/
│   ├── assets/                     # Imagens e recursos visuais
│   ├── components/                 # Componentes de UI reutilizáveis (Button, MetricCard, Sidebar, Skeleton, etc.)
│   ├── features/                   # Módulos organizados por domínio
│   │   ├── auth/                   # Sessão, autenticação e fluxo de senha
│   │   ├── companies/              # Cadastro e listagem de empresas
│   │   ├── contacts/               # Cadastro e listagem de contatos
│   │   ├── inventory/              # Catálogo de produtos e movimentações de estoque
│   │   ├── leads/                  # Funil comercial, paginação/filtros no servidor, validação e resumo RPC
│   │   └── overview/               # Visão geral executiva e cálculo de indicadores comerciais
│   ├── hooks/                      # Hooks compartilhados (ex.: tema claro/escuro)
│   ├── lib/                        # Cliente Supabase e utilitários compartilhados
│   ├── test/                       # Configuração global do Vitest + Testing Library
│   ├── App.tsx                     # Shell principal da aplicação e navegação entre seções
│   ├── App.css                     # Estilos de layout e responsividade do shell
│   └── index.css                   # Design tokens, superfícies em vidro (glass) e animações
└── supabase/
    ├── config.toml                 # Configuração do ambiente local do Supabase CLI
    └── migrations/                 # Histórico sequencial e imutável de migrations SQL
```

---

## Como trabalhar e aplicar migrations com segurança

1. **Nunca edite migrations já aplicadas.** Toda alteração de banco (tabelas, views, policies RLS, triggers ou funções RPC) deve entrar como **um novo arquivo** em `supabase/migrations/<timestamp>_<descricao>.sql`.
2. **Escreva SQL idempotente e seguro:**
   - Use `drop ... if exists` / `create or replace` sempre que aplicável.
   - Em funções SQL/PLpgSQL, defina explicitamente `set search_path = public, pg_temp`.
   - Revogue permissões implícitas (`revoke all ... from public, anon`) e conceda apenas o necessário (`grant ... to authenticated`).
3. **Confira o estado antes de aplicar no projeto remoto:**

   ```bash
   # Lista quais migrations locais já estão aplicadas ou pendentes no banco vinculado
   npx supabase migration list

   # Simula a aplicação (dry-run) mostrando o que seria executado sem alterar o banco
   npx supabase db push --dry-run
   ```

4. **Aplique somente após revisar o SQL e o dry-run:**

   ```bash
   npx supabase db push
   ```

   Evite rodar `supabase migration repair` ou `supabase db reset` contra ambientes compartilhados sem diagnóstico prévio de drift.

---

## Fluxo de branch e Pull Request

1. Atualize a `main` local antes de iniciar qualquer trabalho:

   ```bash
   git checkout main
   git pull
   git status --short
   ```

2. Crie uma branch descritiva a partir da `main` (ex.: `feat/nome-da-entrega` ou `fix/descricao-curta`):

   ```bash
   git checkout -b fix/minha-correcao
   ```

3. Faça commits pequenos e atômicos em português (`fix(escopo): ...`, `feat(escopo): ...`, `chore(escopo): ...`), validando localmente antes de cada commit:

   ```bash
   npm run lint
   npm run build
   npm test
   ```

4. Envie a branch para o GitHub, abra um **Pull Request** para `main`, aguarde o workflow **CI** ficar verde e revise eventuais migrations pendentes antes do merge.
