import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance as axios, API } from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Eye, Edit, Trash2, LogOut, FileText, Users, Calendar, X } from "lucide-react";

const STATUS_COLORS = {
  "URGENTE": "bg-orange-100 text-orange-900 border-orange-500",
  "ABERTO": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "EM ROTA": "bg-gray-100 text-gray-800 border-gray-300",
  "LIBERADO": "bg-blue-100 text-blue-800 border-blue-300",
  "PENDENCIA": "bg-red-100 text-red-800 border-red-300",
  "SUSPENSO": "bg-pink-100 text-pink-800 border-pink-300",
  "DEFINIR": "bg-purple-100 text-purple-800 border-purple-300",
  "RESOLVIDO": "bg-green-100 text-green-800 border-green-300",
  "MANUTENÇÃO PREVENTIVA": "bg-teal-100 text-teal-800 border-teal-300"
};

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

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
  const [showPreventiveModal, setShowPreventiveModal] = useState(false);
  const [preventiveMonth, setPreventiveMonth] = useState("");
  const [preventiveYear, setPreventiveYear] = useState(new Date().getFullYear().toString());
  const [preventiveClient, setPreventiveClient] = useState("");
  const [preventiveUnit, setPreventiveUnit] = useState("");
  const [preventiveEquipment, setPreventiveEquipment] = useState("");
  const [preventiveLoading, setPreventiveLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, patFilter, serialFilter, unitFilter, dateStart, dateEnd, orders]);

  // Recalculate stats whenever filtered orders change
  useEffect(() => {
    const newStats = calculateStats(filteredOrders);
    setStats(newStats);
  }, [filteredOrders]);

  const loadOrders = async () => {
    try {
      const response = await axios.get(`/service-orders`);
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error("Erro ao carregar ordens de serviço");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList) => {
    const statsData = {
      URGENTE: 0,
      ABERTO: 0,
      "EM ROTA": 0,
      LIBERADO: 0,
      PENDENCIA: 0,
      SUSPENSO: 0,
      DEFINIR: 0,
      RESOLVIDO: 0,
      "MANUTENÇÃO PREVENTIVA": 0,
      total: 0
    };

    ordersList.forEach(order => {
      const status = order.status || "ABERTO";
      if (statsData.hasOwnProperty(status)) {
        statsData[status]++;
      }
    });

    statsData.total = ordersList.length;
    return statsData;
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
    // - MANUTENÇÃO PREVENTIVA: only show if current filter month matches scheduled month
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
        
        // If status is MANUTENÇÃO PREVENTIVA, only show in scheduled month
        if (order.status === 'MANUTENÇÃO PREVENTIVA') {
          if (!order.opening_date) return false;
          const orderDate = order.opening_date;
          
          if (dateStart && orderDate < dateStart) return false;
          if (dateEnd && orderDate > dateEnd) return false;
          
          return true;
        }
        
        // For all other statuses, show regardless of date
        return true;
      });
    } else {
      // When no date filter is set, hide preventivas that are not in the current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      filtered = filtered.filter(order => {
        if (order.status === 'MANUTENÇÃO PREVENTIVA') {
          if (!order.opening_date) return false;
          const parts = order.opening_date.split('-');
          if (parts.length >= 2) {
            const orderYear = parseInt(parts[0]);
            const orderMonth = parseInt(parts[1]);
            return orderYear === currentYear && orderMonth === currentMonth;
          }
          return false;
        }
        return true;
      });
    }

    setFilteredOrders(filtered);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta O.S.?")) return;

    try {
      await axios.delete(`/service-orders/${id}`);
      toast.success("O.S. excluída com sucesso");
      loadOrders();
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error("Erro ao excluir O.S.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleCreatePreventive = async () => {
    if (!preventiveMonth) {
      toast.error("Selecione o mês");
      return;
    }
    
    setPreventiveLoading(true);
    try {
      const year = parseInt(preventiveYear);
      const month = parseInt(preventiveMonth);
      const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
      const monthLabel = MONTHS.find(m => m.value === month)?.label || "";
      
      const orderData = {
        ticket_number: "",
        os_number: "",
        pat: "",
        status: "MANUTENÇÃO PREVENTIVA",
        opening_date: firstDay,
        client_name: preventiveClient || "",
        unit: preventiveUnit || "",
        equipment_type: preventiveEquipment || "",
        call_info: `Manutenção Preventiva agendada para ${monthLabel}/${year}`,
        verification_mode: "DIGITAL",
        verifications: []
      };

      await axios.post(`/service-orders`, orderData);
      
      toast.success(`Manutenção Preventiva agendada para ${monthLabel}/${year}!`);
      setShowPreventiveModal(false);
      setPreventiveMonth("");
      setPreventiveClient("");
      setPreventiveUnit("");
      setPreventiveEquipment("");
      loadOrders();
    } catch (error) {
      toast.error("Erro ao agendar manutenção preventiva");
    } finally {
      setPreventiveLoading(false);
    }
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-3 mb-6">
          <div 
            className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-slate-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter("")}
            data-testid="stat-total"
          >
            <p className="text-xs text-slate-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total || 0}</p>
          </div>
          <div 
            className="bg-orange-50 rounded-lg shadow-sm p-4 border-l-4 border-orange-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter(statusFilter === "URGENTE" ? "" : "URGENTE")}
            data-testid="stat-urgente"
          >
            <p className="text-xs text-orange-700 mb-1 font-semibold">Urgente</p>
            <p className="text-2xl font-bold text-orange-900">{stats.URGENTE || 0}</p>
          </div>
          <div 
            className="bg-yellow-50 rounded-lg shadow-sm p-4 border-l-4 border-yellow-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter(statusFilter === "ABERTO" ? "" : "ABERTO")}
            data-testid="stat-aberto"
          >
            <p className="text-xs text-yellow-700 mb-1">Abertos</p>
            <p className="text-2xl font-bold text-yellow-800">{stats.ABERTO || 0}</p>
          </div>
          <div 
            className="bg-gray-50 rounded-lg shadow-sm p-4 border-l-4 border-gray-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter(statusFilter === "EM ROTA" ? "" : "EM ROTA")}
            data-testid="stat-em-rota"
          >
            <p className="text-xs text-gray-700 mb-1">Em Rota</p>
            <p className="text-2xl font-bold text-gray-800">{stats["EM ROTA"] || 0}</p>
          </div>
          <div 
            className="bg-blue-50 rounded-lg shadow-sm p-4 border-l-4 border-blue-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter(statusFilter === "LIBERADO" ? "" : "LIBERADO")}
            data-testid="stat-liberado"
          >
            <p className="text-xs text-blue-700 mb-1">Liberados</p>
            <p className="text-2xl font-bold text-blue-800">{stats.LIBERADO || 0}</p>
          </div>
          <div 
            className="bg-red-50 rounded-lg shadow-sm p-4 border-l-4 border-red-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter(statusFilter === "PENDENCIA" ? "" : "PENDENCIA")}
            data-testid="stat-pendencia"
          >
            <p className="text-xs text-red-700 mb-1">Pendência</p>
            <p className="text-2xl font-bold text-red-800">{stats.PENDENCIA || 0}</p>
          </div>
          <div 
            className="bg-pink-50 rounded-lg shadow-sm p-4 border-l-4 border-pink-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter(statusFilter === "SUSPENSO" ? "" : "SUSPENSO")}
            data-testid="stat-suspenso"
          >
            <p className="text-xs text-pink-700 mb-1">Suspensos</p>
            <p className="text-2xl font-bold text-pink-800">{stats.SUSPENSO || 0}</p>
          </div>
          <div 
            className="bg-purple-50 rounded-lg shadow-sm p-4 border-l-4 border-purple-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter(statusFilter === "DEFINIR" ? "" : "DEFINIR")}
            data-testid="stat-definir"
          >
            <p className="text-xs text-purple-700 mb-1">Definir</p>
            <p className="text-2xl font-bold text-purple-800">{stats.DEFINIR || 0}</p>
          </div>
          <div 
            className="bg-green-50 rounded-lg shadow-sm p-4 border-l-4 border-green-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter(statusFilter === "RESOLVIDO" ? "" : "RESOLVIDO")}
            data-testid="stat-resolvido"
          >
            <p className="text-xs text-green-700 mb-1">Resolvido</p>
            <p className="text-2xl font-bold text-green-800">{stats.RESOLVIDO || 0}</p>
          </div>
          <div 
            className="bg-teal-50 rounded-lg shadow-sm p-4 border-l-4 border-teal-500 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter(statusFilter === "MANUTENÇÃO PREVENTIVA" ? "" : "MANUTENÇÃO PREVENTIVA")}
            data-testid="stat-preventiva"
          >
            <p className="text-xs text-teal-700 mb-1">Preventiva</p>
            <p className="text-2xl font-bold text-teal-800">{stats["MANUTENÇÃO PREVENTIVA"] || 0}</p>
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
                <SelectItem value="MANUTENÇÃO PREVENTIVA">MANUTENÇÃO PREVENTIVA</SelectItem>
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
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => navigate("/create")}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="create-order-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova O.S.
            </Button>
            <Button
              onClick={() => setShowPreventiveModal(true)}
              className="bg-teal-600 hover:bg-teal-700"
              data-testid="preventive-schedule-button"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agendamento Preventiva
            </Button>
            <Button
              onClick={async () => {
                try {
                  if (filteredOrders.length === 0) {
                    toast.error("Nenhuma O.S. para exportar");
                    return;
                  }
                  
                  const orderIds = filteredOrders.map(o => o.id).join(",");
                  
                  const response = await axios.get(`/service-orders/export?ids=${orderIds}`, {
                    responseType: 'blob'
                  });
                  
                  const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "relatorio_ordens_servico.xlsx";
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  toast.success(`${filteredOrders.length} O.S. exportadas com sucesso!`);
                } catch (error) {
                  toast.error("Erro ao exportar relatório");
                }
              }}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
              data-testid="export-button"
            >
              <FileText className="w-4 h-4 mr-2" />
              Exportar Excel ({filteredOrders.length})
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

        {/* Modal Agendamento Preventiva */}
        {showPreventiveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="preventive-modal-overlay">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" data-testid="preventive-modal">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">Agendamento de Manutenção Preventiva</h2>
                <button
                  onClick={() => setShowPreventiveModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                  data-testid="close-preventive-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mês</Label>
                    <Select value={preventiveMonth} onValueChange={setPreventiveMonth}>
                      <SelectTrigger data-testid="preventive-month-select">
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ano</Label>
                    <Select value={preventiveYear} onValueChange={setPreventiveYear}>
                      <SelectTrigger data-testid="preventive-year-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2].map(offset => {
                          const y = new Date().getFullYear() + offset;
                          return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Input
                    value={preventiveClient}
                    onChange={(e) => setPreventiveClient(e.target.value)}
                    placeholder="Nome do cliente"
                    data-testid="preventive-client-input"
                  />
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Input
                    value={preventiveUnit}
                    onChange={(e) => setPreventiveUnit(e.target.value)}
                    placeholder="Unidade"
                    data-testid="preventive-unit-input"
                  />
                </div>
                <div>
                  <Label>Equipamento</Label>
                  <Input
                    value={preventiveEquipment}
                    onChange={(e) => setPreventiveEquipment(e.target.value)}
                    placeholder="Tipo de equipamento"
                    data-testid="preventive-equipment-input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 p-6 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setShowPreventiveModal(false)}
                  data-testid="cancel-preventive-button"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreatePreventive}
                  className="bg-teal-600 hover:bg-teal-700"
                  disabled={preventiveLoading}
                  data-testid="confirm-preventive-button"
                >
                  {preventiveLoading ? "Agendando..." : "Agendar Preventiva"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
