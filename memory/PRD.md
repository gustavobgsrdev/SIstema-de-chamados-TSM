# PRD - Sistema de O.S. (TSM PRINTER SOLUTIONS)

## Problema Original
Aplicação web de Ordem de Serviço para manutenção de impressoras/equipamentos. Suporta preenchimento automático/manual, controle de acesso por roles (Admin/User), visualização impressa personalizada, dashboard com filtros avançados, ordenação customizada e exportação Excel (XLSX).

## Arquitetura
- **Backend**: FastAPI + MongoDB (Motor async)
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Auth**: JWT com roles ADMIN/USER
- **Export**: openpyxl para Excel formatado
- **OCR**: Emergent LLM (GPT-5.1) para extração de dados de imagens

## Funcionalidades Implementadas

### Auth & Usuários
- Login com JWT (24h expiration)
- Roles: ADMIN e USER
- CRUD de usuários (Admin only)
- Edição de usuários (nome, username, senha, role)
- Interceptor axios para 401 -> redirect ao login

### Ordens de Serviço
- CRUD completo
- OCR para preenchimento automático via imagem
- Status: URGENTE, ABERTO, EM ROTA, LIBERADO, PENDENCIA, SUSPENSO, DEFINIR, RESOLVIDO, MANUTENÇÃO PREVENTIVA
- Verificações (modo DIGITAL ou MANUAL/caneta)
- Visualização impressa A4 customizada

### Dashboard
- Cards de estatísticas por status (clicáveis para filtrar)
- Filtros: busca texto, status, PAT, N° série, unidade, período
- Lógica especial: URGENTE sempre no topo; RESOLVIDO filtrado por data; MANUTENÇÃO PREVENTIVA visível só no mês agendado
- Exportação Excel com colunas: CHAMADO, OS, PAT, CLIENTE, UNIDADE, DATA, SITUAÇÃO, MATERIAIS

### Agendamento Preventiva
- Botão "Agendamento Preventiva" no Dashboard
- Modal com seleção de mês/ano, cliente, unidade, equipamento
- Cria O.S. com status MANUTENÇÃO PREVENTIVA e data do 1° dia do mês
- Preventivas só aparecem no dashboard durante o mês agendado

## Credenciais
- Admin: gustavo_tsm / 3758
- User: vinnicius_tsm / 3758

## Stack
- FastAPI, Motor (MongoDB async), PyJWT, bcrypt, openpyxl, Pillow
- React, Axios, React Router, Tailwind, Shadcn UI, Sonner (toasts)

## Endpoints Principais
- POST /api/auth/login
- GET/POST /api/auth/register (admin only)
- GET/PUT/DELETE /api/users/{user_id}
- GET/POST /api/service-orders
- GET/PUT/DELETE /api/service-orders/{id}
- GET /api/service-orders/export?ids=...
- GET /api/service-orders/stats
- POST /api/ocr
