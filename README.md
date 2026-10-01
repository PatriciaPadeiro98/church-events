# Eventos Paroquiais

**Aplicacao web completa para gestao de eventos comunitarios** — caixa registadora, mesas, reservas e exportacao de resultados.

Desenvolvido para a **Paroquia da Reboleira** como ferramenta de gestao de festas e eventos.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://vercel.com/)

---

## Funcionalidades

### Gestao de Eventos
- Criar e listar eventos com nome, data, local e descricao
- Dashboard por evento com acesso rapido a cada modulo
- Navegacao por breadcrumbs intuitiva

### Caixa Registadora
- Abrir multiplas caixas por operador (uso simultaneo)
- Catalogo de produtos com categorias e emojis automaticos
- Carrinho de compras com calculo de total e troco
- Pagamento por **Dinheiro** ou **MB WAY** (com QR Code)
- Controlo de stock em tempo real

### Importacao de Menu por Foto
- Upload de foto de menu (telemovel ou scanner)
- OCR automatico com **Tesseract.js** (100% client-side, zero custo)
- Preview editavel antes de confirmar a importacao
- Detecao automatica de nomes e precos

### Mesas
- Criar e organizar mesas com numero, lugares e responsavel
- Editor visual **drag & drop** para posicionar mesas na planta da sala

### Reservas
- Registar reservas com nome, contacto e numero de pessoas
- Atribuir reservas a mesas especificas
- Estados: pendente, confirmada, cancelada
- Controlo de pagamento (valor pago, pago/nao pago)

### Exportacao
- Exportar resumo completo do evento para **Excel** (.xlsx)
- 3 folhas: Resumo Geral, Produtos, Lista de Vendas
- Discriminacao por metodo de pagamento

---

## Tech Stack

| Tecnologia | Utilizacao |
|---|---|
| **Next.js 16** | Framework React com App Router |
| **React 19** | Interface de utilizador |
| **TypeScript 5** | Tipagem estatica |
| **Tailwind CSS 4** | Estilos utility-first |
| **Prisma 6** | ORM para PostgreSQL |
| **Supabase** | Base de dados PostgreSQL na cloud (gratis) |
| **Tesseract.js** | OCR no browser para leitura de menus |
| **@xyflow/react** | Editor drag & drop de mesas |
| **xlsx** | Geracao de ficheiros Excel |
| **react-qrcode-logo** | QR Codes para pagamento MB WAY |

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx                    # Lista de eventos
│   ├── layout.tsx                  # Layout global com header
│   ├── globals.css                 # Tema e variaveis de cor
│   ├── api/
│   │   ├── eventos/                # CRUD eventos
│   │   ├── produtos/               # CRUD produtos
│   │   ├── categorias/             # CRUD categorias
│   │   ├── caixas/                 # Abrir/fechar caixas
│   │   ├── vendas/                 # Registar vendas
│   │   ├── mesas/                  # CRUD mesas
│   │   ├── reservas/               # CRUD reservas
│   │   └── export/                 # Exportacao Excel
│   └── eventos/[id]/
│       ├── page.tsx                # Dashboard do evento
│       ├── menu/page.tsx           # Gestao de produtos e categorias
│       ├── caixa/page.tsx          # Caixa registadora
│       ├── caixa/resumo/page.tsx   # Resumo de vendas e fecho
│       ├── mesas/page.tsx          # Editor de mesas
│       └── reservas/page.tsx       # Gestao de reservas
├── components/
│   ├── Breadcrumb.tsx              # Navegacao contextual
│   └── MenuImport.tsx              # Importacao de menu por foto (OCR)
├── lib/
│   ├── prisma.ts                   # Cliente Prisma (singleton)
│   ├── emoji.ts                    # Mapeamento automatico de emojis
│   └── menu-parser.ts             # Parser de texto OCR para produtos
prisma/
└── schema.prisma                   # Modelo de dados completo
```

---

## Setup Local

### Pre-requisitos

- **Node.js** 18+
- Conta [Supabase](https://supabase.com) gratuita

### Instalacao

```bash
# Clonar o repositorio
git clone https://github.com/PatriciaPadeiro98/church-events.git
cd church-events

# Instalar dependencias
npm install

# Configurar variaveis de ambiente
cp .env.example .env
# Editar .env com o DATABASE_URL do Supabase

# Sincronizar schema com a base de dados
npx prisma db push

# Gerar cliente Prisma
npx prisma generate

# Iniciar servidor de desenvolvimento
npm run dev
```

---

## Deploy

### Vercel (recomendado — gratis)

1. Fazer push do codigo para o GitHub
2. Importar o repositorio na [Vercel](https://vercel.com)
3. Adicionar a variavel `DATABASE_URL` em **Settings > Environment Variables**
4. O deploy e automatico a cada push

### Nota sobre Supabase

O plano gratuito do Supabase **pausa a base de dados apos 7 dias de inatividade**. Para reativar, basta aceder ao dashboard do Supabase e clicar em "Restore". Os dados sao mantidos.

---

## Autora

Desenvolvido por **Ana Patricia Padeiro**

Projeto pessoal — gestao de eventos para a Paroquia da Reboleira.
