# AGR - Sistema de Atendimento Inteligente

Este é o sistema oficial de gerenciamento de filas e notícias da **AGR (Agência Goiana de Regulação)**. Uma solução moderna, robusta e em tempo real para otimizar o atendimento ao cidadão.

---

## Funcionalidades Principais

*   **Painel de TV (Display):** Transmissão de notícias em tempo real via RSS, exibição de senhas chamadas e avisos sonoros/voz sintetizada.
*   **Totem de Autoatendimento:** Interface intuitiva para emissão de senhas (Normal e Preferencial) dividida por categorias (Ouvidoria, Finanças, Veículos, etc.).
*   **Painel do Atendente:** Controle completo de chamadas, rechamadas, finalização de atendimentos com observações e histórico individual.
*   **Dashboard Administrativo:** Monitoramento em tempo real de guichês ativos, estatísticas de ocupação e exportação de relatórios detalhados em CSV (Excel).
*   **Real-time:** Comunicação instantânea via WebSockets para chamadas de senhas sem atrasos.

---

## Tecnologias Utilizadas

### **Backend**
- **Python + FastAPI:** Alta performance e documentação automática.
- **SQLite:** Banco de dados leve e eficiente para histórico de atendimentos.
- **WebSockets:** Comunicação bidirecional para eventos em tempo real.
- **BeautifulSoup4:** Web scraping inteligente para as últimas notícias da AGR.

### **Frontend**
- **React.js + Vite:** Interface moderna, rápida e responsiva.
- **Lucide React:** Conjunto de ícones elegante e profissional.
- **CSS3 Personalizado:** Design premium com efeitos de glassmorphism e animações suaves.

---

## Como Rodar o Projeto

### **1. Backend (API)**
Certifique-se de ter o Python 3.10+ instalado.

```bash
# Entre na pasta do backend (se necessário) e instale as dependências
pip install fastapi uvicorn beautifulsoup4 requests

# Inicie o servidor
python backend/main.py
```
*A API ficará disponível em http://localhost:8000*

### **2. Frontend (Interface)**
Certifique-se de ter o Node.js instalado.

```bash
# Entre na pasta frontend
cd frontend

# Instale as dependências
npm install

# Inicie o modo de desenvolvimento
npm run dev
```
*O sistema abrirá em http://localhost:5173*

---

## Estrutura do Projeto

```text
├── backend/
│   ├── data/          # Banco de Dados e estado persistente
│   ├── routes/        # Lógica das rotas (Fila, Admin, Notícias)
│   ├── config.py      # Configurações globais do servidor
│   └── main.py        # Ponto de entrada da API
├── frontend/
│   ├── src/
│   │   ├── components/# Componentes React (Totem, Admin, TV, etc.)
│   │   ├── config.js  # Configuração de URLs da API
│   │   └── App.jsx    # Roteamento principal
└── README.md
```

---

## Relatórios e Dados
Os dados de atendimento são salvos permanentemente em `backend/data/atendimentos.db`. Você pode exportar o histórico completo para Excel através do botão **Exportar Planilha** no Painel Administrativo.

---

**Desenvolvido para a Agência Goiana de Regulação por:**
- **Lucas Lustosa Coelho**
- **Leonardo Ferreira Amichi**

*"Inovação e Eficiência no Atendimento Público"*
