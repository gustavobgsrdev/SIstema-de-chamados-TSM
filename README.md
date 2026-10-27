<div align="center">

# 🛠️ Sistema de Chamados — TSM Printer Solutions

**Gestão de ordens de serviço, manutenção e atendimento técnico em um só lugar.**

</div>

---

## 📌 Sobre o projeto

O **Sistema de Chamados TSM** é uma aplicação web desenvolvida para apoiar a rotina de atendimento técnico da **TSM Printer Solutions**, centralizando o registro, acompanhamento e gerenciamento de ordens de serviço (O.S.).

A plataforma foi concebida para facilitar o controle dos equipamentos atendidos, organizar as informações técnicas e oferecer uma visão mais clara do andamento dos chamados.

## ✨ Funcionalidades

- 🔐 **Autenticação e controle de acesso** com perfis de administrador e usuário.
- 🧾 **Cadastro e gerenciamento de ordens de serviço**.
- 📊 **Dashboard** com indicadores e acompanhamento dos chamados.
- 🔎 **Filtros de pesquisa** por informações como patrimônio, unidade, número de série, período e status.
- 🚦 **Organização por status** e destaque para chamados urgentes.
- 🖨️ **Visualização de impressão** em formato A4, com identidade visual TSM.
- 📤 **Exportação de dados para Excel**.
- ☑️ **Checklist** com opções de preenchimento manual ou digital.

> ℹ️ O repositório registra também funcionalidades em desenvolvimento, como edição de usuários pelo administrador, tratamento global de sessão expirada e interface para agendamento de manutenção preventiva. Consulte o estado atual do código antes de considerar esses recursos disponíveis em produção.

## 🧰 Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Front-end | React, JavaScript, Tailwind CSS, componentes Shadcn/Radix |
| Back-end | Python, FastAPI |
| Banco de dados | MongoDB |
| Autenticação | JWT |
| Exportação | Excel (XLSX) |

## 🗂️ Estrutura do projeto

```text
Sistema-de-chamados-TSM/
├── backend/
│   ├── server.py          # API e regras de negócio
│   ├── storage.py         # Acesso e persistência de dados
│   ├── init_users.py      # Inicialização de usuários
│   └── requirements.txt    # Dependências Python
├── frontend/
│   ├── public/            # Arquivos públicos e identidade visual
│   ├── src/               # Interface da aplicação
│   └── package.json       # Dependências e scripts
├── backend_test.py         # Testes do back-end
└── README.md
```

## 🚀 Como executar localmente

### Pré-requisitos

Antes de iniciar, tenha instalado:

- [Node.js](https://nodejs.org/)
- [Yarn](https://classic.yarnpkg.com/) ou npm
- [Python](https://www.python.org/)
- [MongoDB](https://www.mongodb.com/) (instância local ou serviço compatível)

### 1. Clone o repositório

```bash
git clone https://github.com/gustavobgsrdev/SIstema-de-chamados-TSM.git
cd SIstema-de-chamados-TSM
```

### 2. Configure o back-end

```bash
cd backend
python -m venv .venv
```

Ative o ambiente virtual:

**Windows**
```bash
.venv\Scripts\activate
```

**Linux / macOS**
```bash
source .venv/bin/activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Configure as variáveis de ambiente necessárias para a conexão com o MongoDB e demais configurações utilizadas pelo back-end. Consulte o código em `backend/server.py` e `backend/storage.py` para identificar os nomes e valores esperados. Não compartilhe credenciais ou segredos no repositório.

Inicie a API (a partir da pasta `backend`):

```bash
uvicorn server:app --reload
```

### 3. Configure o front-end

Em outro terminal, a partir da raiz do projeto:

```bash
cd frontend
yarn install
yarn start
```

Ou, utilizando npm:

```bash
npm install
npm start
```

O front-end será iniciado no endereço:

**http://localhost:3000**

> ⚙️ Verifique se a URL da API configurada no front-end aponta para o endereço em que o back-end está sendo executado.

## 🧪 Testes

O projeto contém um arquivo de testes para o back-end (`backend_test.py`). A execução pode depender de variáveis de ambiente e de serviços configurados.

Exemplo:

```bash
pytest backend_test.py
```

## 🔒 Segurança

- Configure segredos e credenciais por variáveis de ambiente.
- Não envie arquivos `.env`, tokens, senhas ou dados de clientes para o Git.
- Utilize HTTPS e controles de acesso adequados em ambientes publicados.
- Revise os usuários e permissões antes de disponibilizar o sistema para uso.

## 📍 Repositório

🔗 [Acessar o projeto no GitHub](https://github.com/gustavobgsrdev/SIstema-de-chamados-TSM)

---

<div align="center">

**TSM Printer Solutions**  
*Organização, agilidade e controle no atendimento técnico.*

</div>
