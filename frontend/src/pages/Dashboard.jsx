import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Eye, Edit, Trash2, LogOut, FileText, Users } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_COLORS = {
  "URGENTE": "bg-orange-100 text-orange-900 border-orange-500",
  "ABERTO": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "EM ROTA": "bg-gray-100 text-gray-800 border-gray-300",
  "LIBERADO": "bg-blue-100 text-blue-800 border-blue-300",
  "PENDENCIA": "bg-red-100 text-red-800 border-red-300",
  "SUSPENSO": "bg-pink-100 text-pink-800 border-pink-300",
  "DEFINIR": "bg-purple-100 text-purple-800 border-purple-300",
  "RESOLVIDO": "bg-green-100 text-green-800 border-green-300"
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [user, setUser] = useState(null);
  
  // Get current month dates
  const getCurrentMonthDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    };
  };

  const defaultDates = getCurrentMonthDates();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [patFilter, setPatFilter] = useState("");
  const [serialFilter, setSerialFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [dateStart, setDateStart] = useState(defaultDates.start);
  const [dateEnd, setDateEnd] = useState(defaultDates.end);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadOrders();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, patFilter, serialFilter, unitFilter, dateStart, dateEnd, orders]);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/service-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      toast.error("Erro ao carregar ordens de serviço");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/service-orders/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas");
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Search filter (ticket_number or os_number or client)
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.os_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter && statusFilter.trim()) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // PAT filter
    if (patFilter) {
      filtered = filtered.filter(order => 
        order.pat?.toLowerCase().includes(patFilter.toLowerCase())
      );
    }

    // Serial number filter
    if (serialFilter) {
      filtered = filtered.filter(order => 
        order.equipment_serial?.toLowerCase().includes(serialFilter.toLowerCase())
      );
    }

    // Unit filter
    if (unitFilter) {
      filtered = filtered.filter(order => 
        order.unit?.toLowerCase().includes(unitFilter.toLowerCase())
      );
    }

    // Special date filter logic:
    // - RESOLVIDO: only show within date range
    // - Other statuses: always show regardless of date
    if (dateStart || dateEnd) {
      filtered = filtered.filter(order => {
        // If status is RESOLVIDO, apply date filter
        if (order.status === 'RESOLVIDO') {
          if (!order.opening_date) return false;
          const orderDate = order.opening_date;
          
          if (dateStart && orderDate < dateStart) return false;
          if (dateEnd && orderDate > dateEnd) return false;
          
          return true;
        }
        
        // For all other statuses, show regardless of date
        return true;
      });
    }

    setFilteredOrders(filtered);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta O.S.?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/service-orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("O.S. excluída com sucesso");
      loadOrders();
      loadStats();
    } catch (error) {
      toast.error("Erro ao excluir O.S.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/tsm-logo.png" alt="TSM Printer Solutions" className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Sistema de O.S.</h1>
                <p className="text-sm text-slate-600">Gerenciamento de Ordens de Serviço</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Olá, {user?.name}</span>
              {user?.role === "ADMIN" && (
                <Button
                  onClick={() => navigate("/users")}
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  data-testid="manage-users-button"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Usuários
                </Button>
              )}
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-800"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-slate-500">
            <p className="text-xs text-slate-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total || 0}</p>
          </div>
          <div className="bg-orange-50 rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
            <p className="text-xs text-orange-700 mb-1 font-semibold">Urgente</p>
            <p className="text-2xl font-bold text-orange-900">{stats.URGENTE || 0}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <p className="text-xs text-yellow-700 mb-1">Abertos</p>
            <p className="text-2xl font-bold text-yellow-800">{stats.ABERTO || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg shadow-sm p-4 border-l-4 border-gray-500">
            <p className="text-xs text-gray-700 mb-1">Em Rota</p>
            <p className="text-2xl font-bold text-gray-800">{stats["EM ROTA"] || 0}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <p className="text-xs text-blue-700 mb-1">Liberados</p>
            <p className="text-2xl font-bold text-blue-800">{stats.LIBERADO || 0}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <p className="text-xs text-red-700 mb-1">Pendência</p>
            <p className="text-2xl font-bold text-red-800">{stats.PENDENCIA || 0}</p>
          </div>
          <div className="bg-pink-50 rounded-lg shadow-sm p-4 border-l-4 border-pink-500">
            <p className="text-xs text-pink-700 mb-1">Suspensos</p>
            <p className="text-2xl font-bold text-pink-800">{stats.SUSPENSO || 0}</p>
          </div>
          <div className="bg-purple-50 rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
            <p className="text-xs text-purple-700 mb-1">Definir</p>
            <p className="text-2xl font-bold text-purple-800">{stats.DEFINIR || 0}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <p className="text-xs text-green-700 mb-1">Resolvido</p>
            <p className="text-2xl font-bold text-green-800">{stats.RESOLVIDO || 0}</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por Nº O.S., Cliente, Chamado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={statusFilter || "TODAS"} onValueChange={(value) => setStatusFilter(value === "TODAS" ? "" : value)}>
              <SelectTrigger data-testid="status-filter">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas</SelectItem>
                <SelectItem value="URGENTE">URGENTE</SelectItem>
                <SelectItem value="ABERTO">ABERTO</SelectItem>
                <SelectItem value="EM ROTA">EM ROTA</SelectItem>
                <SelectItem value="LIBERADO">LIBERADO</SelectItem>
                <SelectItem value="PENDENCIA">PENDÊNCIA</SelectItem>
                <SelectItem value="SUSPENSO">SUSPENSO</SelectItem>
                <SelectItem value="DEFINIR">DEFINIR</SelectItem>
                <SelectItem value="RESOLVIDO">RESOLVIDO</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="PAT"
              value={patFilter}
              onChange={(e) => setPatFilter(e.target.value)}
              data-testid="pat-filter"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Input
              type="text"
              placeholder="Nº Série"
              value={serialFilter}
              onChange={(e) => setSerialFilter(e.target.value)}
              data-testid="serial-filter"
            />
            <Input
              type="text"
              placeholder="Unidade"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              data-testid="unit-filter"
            />
            <div>
              <Input
                type="date"
                placeholder="Data Início"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                data-testid="date-start-filter"
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="Data Fim"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                data-testid="date-end-filter"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/create")}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="create-order-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova O.S.
            </Button>
            <Button
              onClick={async () => {
                try {
                  const token = localStorage.getItem("token");
                  const response = await fetch(`${API}/service-orders/export`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "relatorio_ordens_servico.csv";
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  toast.success("Relatório exportado com sucesso!");
                } catch (error) {
                  toast.error("Erro ao exportar relatório");
                }
              }}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
              data-testid="export-button"
            >
              <FileText className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {searchTerm || statusFilter || patFilter ? "Nenhuma O.S. encontrada" : "Nenhuma O.S. cadastrada"}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || statusFilter || patFilter
                ? "Tente ajustar os filtros"
                : "Comece criando sua primeira ordem de serviço"}
            </p>
            {!searchTerm && !statusFilter && !patFilter && (
              <Button onClick={() => navigate("/create")} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira O.S.
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 ${STATUS_COLORS[order.status || "ABERTO"].split(" ")[2]}`}
                data-testid={`order-card-${order.id}`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">
                        Chamado #{order.ticket_number || "S/N"}
                      </h3>
                      {order.os_number && (
                        <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          O.S.: {order.os_number}
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLORS[order.status || "ABERTO"]}`}>
                        {order.status || "ABERTO"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                      {order.client_name && (
                        <p>
                          <span className="font-medium">Cliente:</span> {order.client_name}
                        </p>
                      )}
                      {order.pat && (
                        <p>
                          <span className="font-medium">PAT:</span> {order.pat}
                        </p>
                      )}
                      {order.opening_date && (
                        <p>
                          <span className="font-medium">Data:</span> {order.opening_date}
                        </p>
                      )}
                      {order.responsible_tech && (
                        <p>
                          <span className="font-medium">Técnico:</span> {order.responsible_tech}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/view/${order.id}`)}
                      variant="outline"
                      size="sm"
                      data-testid={`view-button-${order.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      onClick={() => navigate(`/edit/${order.id}`)}
                      variant="outline"
                      size="sm"
                      data-testid={`edit-button-${order.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(order.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`delete-button-${order.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
