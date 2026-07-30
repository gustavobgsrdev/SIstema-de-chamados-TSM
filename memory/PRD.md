# PRD - Sistema de Chamados (TSM PRINTER SOLUTIONS)

## Problema Original
Aplicação web de Chamados para manutenção de impressoras/equipamentos. Suporta preenchimento automático/manual, controle de acesso por roles (Admin/User), visualização impressa personalizada, dashboard com filtros avançados, ordenação customizada, exportação Excel (XLSX) e assinatura digital.

## Arquitetura
- **Backend**: FastAPI + MongoDB (Motor async)
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Auth**: JWT com roles ADMIN/USER
- **Export**: openpyxl para Excel formatado

## Funcionalidades Implementadas

### Auth & Usuários
- Login com JWT (24h expiration)
- Roles: ADMIN e USER
- CRUD de usuários (Admin only) com edição completa
- Interceptor axios para 401 -> redirect ao login

### Chamados (Ordens de Serviço)
- CRUD completo
- Auto-incremento do Nº do Chamado
- Campos: Data/Hora Abertura + Data/Hora Atendimento
- Datas exibidas em formato DD/MM/AAAA
- Status: URGENTE, ABERTO, EM ROTA, LIBERADO, PENDENCIA, SUSPENSO, DEFINIR, RESOLVIDO, MANUTENÇÃO PREVENTIVA
- Verificações (modo DIGITAL ou MANUAL/caneta)
- Visualização impressa A4 customizada

### Assinatura Digital
- Botão "Assinar" em cada chamado no Dashboard
- Fluxo: Revisão dados -> Assinatura Cliente (canvas) -> Assinatura Técnico (canvas)
- Assinaturas salvas com nome + imagem + data/hora
- Exibidas na visualização do chamado com data/hora da assinatura

### Dashboard
- Cards de estatísticas por status (clicáveis)
- Filtros: busca, status, PAT, Nº série, unidade, período
- Agendamento Preventiva (modal mês/ano)
- Preventivas visíveis apenas no mês agendado
- Exportação Excel com: CHAMADO, OS, PAT, CLIENTE, UNIDADE, DATA ABERTURA, DATA ATENDIMENTO, SITUAÇÃO, MATERIAIS

## Credenciais
- Admin: gustavo_tsm / 3758
- User: vinnicius_tsm / 3758

## Endpoints
- POST /api/auth/login
- GET/POST /api/auth/register
- GET/PUT/DELETE /api/users/{user_id}
- GET/POST /api/service-orders
- GET/PUT/DELETE /api/service-orders/{id}
- PUT /api/service-orders/{id}/sign
- GET /api/service-orders/next-ticket
- GET /api/service-orders/export
- GET /api/service-orders/stats
