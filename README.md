# 🌙 Luna Templates — WABA Manager

Plataforma web para gerenciar templates de mensagem da WhatsApp Business API (WABA Oficial Meta). Parte do projeto **Luna v2** da HPrime Películas.

**Stack:** React 18 · Vite · TailwindCSS · Supabase (Auth + Postgres) · Nginx · Docker

---

## ✨ Features

- 🔐 Autenticação via Supabase (email/senha)
- 🔗 Conexão com Meta Graph API v21.0 usando seu próprio Access Token
- 📋 Listar todos os templates da WABA com filtros por status
- ➕ Criar templates (Marketing / Utility / Authentication)
- ✏️ Editar templates existentes (componentes e categoria)
- 🗑️ Excluir templates
- 👁️ Preview WhatsApp realista durante a edição
- 📱 Interface responsiva (mobile / desktop)
- 🔒 RLS no Supabase — cada usuário só vê suas próprias credenciais
- 🐳 Pronto para Docker / Portainer com env injection em runtime

---

## 🚀 Quick Start — Desenvolvimento Local

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. No SQL Editor, execute o conteúdo de `supabase/schema.sql`
3. Copie a **Project URL** e a **anon key** (Settings → API)

### 2. Instalar e rodar

```bash
cp .env.example .env
# edite .env com os valores do Supabase

npm install
npm run dev
```

Acesse `http://localhost:5173`.

### 3. Configurar Meta na primeira tela

Após criar conta e logar, vá em **Conexão Meta** e preencha:
- **WABA ID** — ID da sua WhatsApp Business Account
- **Permanent Access Token** — Token do System User com escopo `whatsapp_business_management`

Como obter as credenciais Meta está documentado dentro da própria tela de Settings.

---

## 🐳 Deploy em Portainer

### Opção 1 — Build do código-fonte (recomendado para começar)

1. Suba o código para um Git repo (ou faça upload via Portainer)
2. No Portainer: **Stacks → Add stack → Git Repository**
3. Aponte para o repositório e configure o **Compose path** como `docker-compose.yml`
4. Em **Environment variables**, adicione:

   | Nome | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | URL do seu projeto Supabase |
   | `VITE_SUPABASE_ANON_KEY` | Anon key do Supabase |
   | `LUNA_PORT` | `8080` (ou outra porta livre) |

5. Clique em **Deploy the stack**

A app fica em `http://seu-servidor:8080`.

### Opção 2 — Imagem pré-buildada (produção)

```bash
# Build local e push para seu registry
docker build -t seu-registry.com/luna-templates:1.0 .
docker push seu-registry.com/luna-templates:1.0
```

No `docker-compose.yml`, comente o bloco `build:` e descomente a linha `image:` apontando para o registry.

### Opção 3 — Docker run direto

```bash
docker build -t luna-templates .

docker run -d \
  --name luna-templates \
  --restart unless-stopped \
  -p 8080:80 \
  -e VITE_SUPABASE_URL="https://xxx.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="eyJ..." \
  luna-templates
```

---

## 🏗️ Arquitetura

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Browser    │────▶│  Nginx (Docker) │────▶│ Static SPA   │
└──────────────┘     │  + env.js       │     └──────────────┘
       │             └─────────────────┘
       │
       │   1. Login / sessão                ┌──────────────┐
       └─────────────────────────────────▶│   Supabase   │
       │                                    │  (Auth+DB)   │
       │   2. Salva/lê credenciais Meta     │   + RLS      │
       │      (RLS por user_id)             └──────────────┘
       │
       │   3. Chama Meta Graph API          ┌──────────────┐
       └─────────────────────────────────▶│  Meta WABA   │
                                            │   Graph API  │
                                            └──────────────┘
```

**Por que chamadas direto do browser pra Meta?**  
A anon key do Supabase é segura (RLS protege), e cada usuário usa seu próprio token Meta — não há credencial compartilhada para esconder no backend. Para produção com múltiplas equipes, pode-se mover as chamadas Meta para Supabase Edge Functions.

---

## 🔧 Variáveis de Ambiente

Todas são **runtime** (injetadas pelo `docker-entrypoint.sh` em `/env.js`), então a mesma imagem Docker funciona com diferentes Supabases sem rebuildar.

| Variável | Descrição | Obrigatória |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Anon key do Supabase | ✅ |
| `LUNA_PORT` | Porta no host (default 8080) | ❌ |

---

## 📂 Estrutura do projeto

```
luna-templates/
├── docker-compose.yml          # Stack Portainer
├── Dockerfile                  # Multi-stage build
├── nginx.conf                  # Config Nginx (SPA fallback + gzip)
├── docker-entrypoint.sh        # Injeta env.js em runtime
├── .env.example                # Modelo de variáveis
├── supabase/
│   └── schema.sql              # Schema + RLS para o Supabase
└── src/
    ├── main.jsx                # Entry point React
    ├── App.jsx                 # Router + protected routes
    ├── index.css               # Tailwind + estilos globais
    ├── lib/
    │   ├── supabase.js         # Client Supabase + runtime env
    │   └── meta.js             # Meta Graph API client
    ├── contexts/
    │   └── AuthContext.jsx     # Auth state
    ├── components/
    │   ├── Layout.jsx          # Sidebar + main wrapper
    │   ├── TemplateEditor.jsx  # Modal criar/editar
    │   └── TemplatePreview.jsx # Modal preview
    └── pages/
        ├── LoginPage.jsx
        ├── TemplatesPage.jsx
        └── SettingsPage.jsx
```

---

## 🔒 Segurança

- **RLS habilitado** no Supabase: cada usuário só lê/escreve sua própria linha em `meta_credentials`
- **Access tokens Meta** ficam no Postgres do Supabase (não em local/session storage)
- Para criptografia em rest dos tokens, ative `pgsodium` no Supabase e use `vault` para o campo `access_token`
- HTTPS deve ser terminado por um reverse proxy à frente (Traefik, Caddy, Cloudflare) — as labels Traefik já estão prontas no `docker-compose.yml`

---

## 🐛 Troubleshooting

**"Supabase não configurado"**  
Variáveis de ambiente não chegaram ao container. Verifique no Portainer se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão setadas e refaça o deploy.

**"Falha ao carregar templates"**  
Confira na tela Conexão Meta se o token tem escopo `whatsapp_business_management` e se o WABA ID está correto. Use o botão **Testar conexão**.

**Container reinicia em loop**  
Veja os logs: `docker logs luna-templates`. Geralmente é a porta `8080` em uso — mude `LUNA_PORT`.

---

HPrime Películas · Luna v2 · 2025
