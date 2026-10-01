# Caixa Registadora

Uma aplicação web de ponto de venda (POS) pensada para eventos — feiras, festas, mercados, e similares. Permite gerir produtos, registar vendas em tempo real, e exportar relatórios no final do evento.

---

## Funcionalidades

- **Gestão de eventos** — cria, abre, fecha e elimina eventos; só é possível vender com um evento ativo
- **Catálogo de produtos** — registo de produtos com emoji, preço e stock; alerta de stock mínimo
- **Caixa registadora** — carrinho com controlo de quantidade, suporte a pagamento em dinheiro (com troco automático) e MB WAY
- **Histórico de vendas** — consulta e anulação de vendas por evento, com resumo de receita e unidades vendidas
- **Exportação CSV** — download do histórico de vendas em formato CSV para análise externa
- **Persistência local** — carrinho e preferências guardados no browser entre sessões
- **Base de dados SQLite** — dados persistidos em SQLite via servidor Express, acessível em rede local (útil para múltiplas caixas no mesmo evento)

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19, TypeScript, Vite |
| Routing | React Router v7 |
| Animações | Framer Motion |
| Ícones | Lucide React |
| Backend | Express + better-sqlite3 |
| Testes | Node.js built-in test runner |

---

## Arquitetura

```
src/
├── components/      # Componentes reutilizáveis (Input, ProductCard, Modais…)
├── models/          # Tipos TypeScript (Sale, Product, Event, CartItem…)
├── pages/           # Páginas com lógica extraída em custom hooks
│   ├── cash-register/
│   ├── events/
│   ├── history/
│   └── products/
├── storages/        # Camada de acesso a dados (API calls ao servidor)
└── utils/           # Lógica pura e testada (carrinho, vendas, moeda…)
```

A lógica de negócio está separada dos componentes através de custom hooks (`useCashRegister`, `useEvents`, `useProducts`), e as funções puras críticas têm cobertura de testes.

---

## Como correr

### Pré-requisitos

- Node.js 22+

### Desenvolvimento

```bash
npm install
npm run dev
```

Inicia o frontend (Vite) e o servidor Express em simultâneo. Acede em `http://localhost:5173`.

### Produção (rede local)

```bash
npm run build
npm start
```

O servidor serve o build estático e expõe a API. Útil para correr num computador e aceder de outros dispositivos na mesma rede (ex: múltiplas caixas num evento).

### Testes

```bash
npm test
```

---

## Variáveis de ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| `PORT` | Porta do servidor | `3000` |
| `DB_PATH` | Caminho para o ficheiro SQLite | `./db.sqlite` |
