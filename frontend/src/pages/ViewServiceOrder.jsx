import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Printer, Edit } from "lucide-react";
import "./ViewServiceOrder.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ViewServiceOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/service-orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(response.data);
    } catch (error) {
      toast.error("Erro ao carregar O.S.");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header (no-print) */}
      <header className="bg-white border-b border-slate-200 no-print">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/dashboard")}
                variant="ghost"
                size="sm"
                data-testid="back-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Visualizar O.S.</h1>
                <p className="text-sm text-slate-600">O.S. #{order.os_number || "S/N"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(`/edit/${id}`)}
                variant="outline"
                data-testid="edit-button"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="print-button"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Print Content */}
      <main className="container mx-auto px-6 py-8" data-testid="order-content">
        <div className="bg-white rounded-xl shadow-sm p-8 print:shadow-none print:rounded-none">
          {/* Header for print */}
          <div className="mb-8 pb-6 border-b border-slate-200">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">ORDEM DE SERVIÇO</h1>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Nº O.S.:</span> {order.os_number || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Nº Chamado:</span> {order.ticket_number || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Data Abertura:</span> {order.opening_date || "N/A"}
              </div>
              <div>
                <span className="font-semibold">PAT:</span> {order.pat || "N/A"}
              </div>
            </div>
          </div>

          {/* Informações Básicas */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Informações Básicas</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Responsável Abertura:</span> {order.responsible_opening || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Técnico Responsável:</span> {order.responsible_tech || "N/A"}
              </div>
            </div>
          </section>

          {/* Cliente */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Dados do Cliente</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Cliente:</span> {order.client_name || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Telefone:</span> {order.phone || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Unidade:</span> {order.unit || "N/A"}
              </div>
              <div className="col-span-2">
                <span className="font-semibold">Endereço de Atendimento:</span> {order.service_address || "N/A"}
              </div>
            </div>
          </section>

          {/* Equipamento */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Informações do Equipamento</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">S/N Equipamento:</span> {order.equipment_serial || "N/A"}
              </div>
              <div>
                <span className="font-semibold">S/N Placa:</span> {order.equipment_board_serial || "N/A"}
              </div>
            </div>
          </section>

          {/* Chamado */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Informações do Chamado</h2>
            <div className="space-y-3 text-sm">
              {order.call_info && (
                <div>
                  <span className="font-semibold">Descrição:</span>
                  <p className="mt-1 whitespace-pre-wrap">{order.call_info}</p>
                </div>
              )}
              {order.materials && (
                <div>
                  <span className="font-semibold">Materiais Utilizados:</span>
                  <p className="mt-1 whitespace-pre-wrap">{order.materials}</p>
                </div>
              )}
              {order.technical_report && (
                <div>
                  <span className="font-semibold">Laudo Técnico:</span>
                  <p className="mt-1 whitespace-pre-wrap">{order.technical_report}</p>
                </div>
              )}
            </div>
          </section>

          {/* Verificações */}
          {order.verifications && order.verifications.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Verificações</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-2 border border-slate-300">Item Verificado</th>
                      <th className="text-center p-2 border border-slate-300 w-24">Situação</th>
                      <th className="text-left p-2 border border-slate-300">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.verifications.map((verification, index) => (
                      <tr key={index}>
                        <td className="p-2 border border-slate-300">{verification.item}</td>
                        <td className="p-2 border border-slate-300 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            verification.status === "BOA" ? "bg-green-100 text-green-800" :
                            verification.status === "RUIM" ? "bg-red-100 text-red-800" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {verification.status}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-300">{verification.observation || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Informações Finais */}
          <section className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Informações Finais</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Contador Total de Páginas:</span> {order.total_page_count || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Próxima Visita:</span> {order.next_visit || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Equipamento Trocado:</span> {order.equipment_replaced ? "Sim" : "Não"}
              </div>
            </div>
            {order.pending_issues && (
              <div className="mt-3">
                <span className="font-semibold">Pendências:</span>
                <p className="mt-1 whitespace-pre-wrap text-sm">{order.pending_issues}</p>
              </div>
            )}
            {order.observations && (
              <div className="mt-3">
                <span className="font-semibold">Observações Gerais:</span>
                <p className="mt-1 whitespace-pre-wrap text-sm">{order.observations}</p>
              </div>
            )}
          </section>

          {/* Assinaturas */}
          <section className="mt-12 pt-8 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="border-t border-slate-400 pt-2 mt-12">
                  <p className="text-sm font-semibold">Assinatura do Técnico</p>
                  <p className="text-xs text-slate-600 mt-1">{order.responsible_tech || ""}</p>
                </div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-2 mt-12">
                  <p className="text-sm font-semibold">Assinatura do Cliente</p>
                  <p className="text-xs text-slate-600 mt-1">Ciente do serviço executado</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ViewServiceOrder;
