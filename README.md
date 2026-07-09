# Sistema de Atendimento Inteligente

Este é o sistema oficial de gerenciamento de filas e notícias do **Estado de Goiás**. Uma solução moderna, robusta e em tempo real para otimizar o atendimento ao cidadão.

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
- **BeautifulSoup4 + HTTPX:** Web scraping assíncrono para as últimas notícias do Governo do Estado de Goiás.

### **Frontend**
- **React.js + Vite:** Interface moderna, rápida e responsiva.
- **Lucide React:** Conjunto de ícones elegante e profissional.
- **CSS3 Personalizado:** Design premium com efeitos de glassmorphism e animações suaves.

---

## Como Rodar o Projeto

### **Inicialização Simplificada (Recomendado para Windows)**

O projeto conta com um script automatizado que verifica os requisitos, instala as dependências necessárias e inicializa tanto o backend quanto o frontend em janelas de terminal visíveis para fácil monitoramento e depuração.

Para rodar o sistema:

1. Instale o **Python 3.10+** (certifique-se de marcar a opção **"Add Python to PATH"** durante a instalação).
2. Instale o **Node.js** (versão LTS recomendada).
3. Dê dois cliques no arquivo **`iniciar.bat`** na raiz do projeto. Ele cuidará do restante automaticamente!
4. Para encerrar o sistema, basta fechar as duas janelas de terminal abertas ou dar dois cliques no arquivo **`parar.bat`** (que encerrará de forma limpa os processos nas portas correspondentes).

---

### **Configuração Manual (Passo a Passo)**

Caso prefira fazer a instalação manualmente via terminal:

#### **1. Backend (API)**
Certifique-se de ter o Python 3.10+ instalado.

```bash
# Instale as dependências
pip install fastapi uvicorn beautifulsoup4 httpx

# Inicie o servidor
python backend/main.py
```
*A API ficará disponível em http://localhost:8001*

#### **2. Frontend (Interface)**
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

## Demonstração do Fluxo do Sistema

### **1. Painel do Atendente (Login e Seleção)**
O atendente seleciona o setor de atendimento e informa o número do guichê ou mesa onde se localiza.
![Seleção de Setor pelo Atendente](docs/images/print1_atendente_setor.png)

### **2. Painel do Atendente (Controle de Senhas)**
Interface completa do atendente para chamar a próxima senha, rechamar senhas passadas, finalizar o atendimento com observações e gerenciar a fila.
![Painel de Controle do Atendente](docs/images/print2_atendente_painel.png)

### **3. Totem de Autoatendimento (Categorias)**
Tela de escolha onde o cidadão (ou atendente de triagem) escolhe o setor do serviço desejado.
![Totem de Autoatendimento](docs/images/print3_totem_setores.png)

### **4. Totem de Autoatendimento (Tipo de Atendimento)**
Escolha entre o atendimento **Normal** ou **Preferencial**.
![Seleção de Tipo de Atendimento](docs/images/print4_totem_tipo.png)

### **5. Impressão de Senha**
Ao selecionar o tipo de atendimento, o sistema gera e abre o diálogo de impressão do ticket com a senha térmica.
![Impressão do Ticket de Senha](docs/images/print5_impressao_senha.png)

---

## Estrutura do Projeto

```text
├── backend/
│   ├── data/          # Banco de Dados SQLite (atendimentos.db)
│   ├── routes/        # Rotas da API (admin, news, queue)
│   ├── config.py      # Configurações do servidor
│   ├── database.py    # Conexão e setup do banco
│   ├── models.py      # Esquemas de dados (Pydantic/SQL)
│   ├── news_service.py# Lógica de extração de notícias
│   ├── websocket.py   # Gerenciamento de conexões em tempo real
│   └── main.py        # Ponto de entrada (Uvicorn)
├── frontend/
│   ├── src/
│   │   ├── components/# Componentes React
│   │   ├── config.js  # Configuração de URLs e Setores
│   │   ├── App.jsx    # Roteamento principal
│   │   └── main.jsx   # Inicialização do React
├── iniciar.bat
└── parar.bat
```

---

## Relatórios e Dados
Os dados de atendimento são salvos permanentemente em `backend/data/atendimentos.db`. Você pode exportar o histórico completo para Excel através do botão **Exportar Planilha** no Painel Administrativo.

---

**Desenvolvido para o Estado de Goiás por:**
- **Lucas Lustosa Coelho**
- **Leonardo Ferreira Amichi**

*"Inovação e Eficiência no Atendimento Público"*
