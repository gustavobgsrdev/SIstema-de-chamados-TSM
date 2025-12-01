import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Search, Eye, Edit, Trash2, LogOut, FileText } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadOrders();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = orders.filter(
        (order) =>
          order.os_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders]);

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

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta O.S.?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/service-orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("O.S. excluída com sucesso");
      loadOrders();
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
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Sistema de O.S.</h1>
                <p className="text-sm text-slate-600">Gerenciamento de Ordens de Serviço</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Olá, {user?.name}</span>
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
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nº O.S., cliente ou chamado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <Button
            onClick={() => navigate("/create")}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="create-order-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova O.S.
          </Button>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {searchTerm ? "Nenhuma O.S. encontrada" : "Nenhuma O.S. cadastrada"}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm
                ? "Tente buscar com outros termos"
                : "Comece criando sua primeira ordem de serviço"}
            </p>
            {!searchTerm && (
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
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
                data-testid={`order-card-${order.id}`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">
                        O.S. #{order.os_number || "S/N"}
                      </h3>
                      {order.ticket_number && (
                        <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          Chamado: {order.ticket_number}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                      {order.client_name && (
                        <p>
                          <span className="font-medium">Cliente:</span> {order.client_name}
                        </p>
                      )}
                      {order.equipment_serial && (
                        <p>
                          <span className="font-medium">S/N:</span> {order.equipment_serial}
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
