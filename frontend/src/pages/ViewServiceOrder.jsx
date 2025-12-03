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

      {/* Print Content - Excel Layout */}
      <main className="container mx-auto px-6 py-8" data-testid="order-content">
        <div className="bg-white print-container" style={{ maxWidth: '210mm', margin: '0 auto', padding: '10mm', fontSize: '10pt' }}>
          
          {/* Header with Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            <div>
              <h1 style={{ fontSize: '20pt', fontWeight: 'bold', margin: 0, color: '#1e40af' }}>TSM PRINTER SOLUTIONS</h1>
              <p style={{ fontSize: '9pt', margin: '2px 0', color: '#64748b' }}>Soluções em Impressão e Manutenção</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '8pt' }}>
              <p style={{ margin: '2px 0' }}><strong>Contato:</strong></p>
              <p style={{ margin: '2px 0' }}>21 99637-4664</p>
              <p style={{ margin: '2px 0' }}>21 3758-5168</p>
            </div>
          </div>

          {/* Title */}
          <h2 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', margin: '10px 0', textTransform: 'uppercase' }}>ORDEM DE SERVIÇO</h2>

          {/* Main Info Table */}
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '8px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '20%', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Responsável Abertura</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '30%' }}>{order.responsible_opening || ''}</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '15%', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Nº Chamado</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '35%' }}>{order.ticket_number || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Nº da O.S.</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px' }}>{order.os_number || ''}</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>PAT</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px' }}>{order.pat || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Data Abertura</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px' }}>{order.opening_date || ''}</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Responsável Técnico</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px' }}>{order.responsible_tech || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Telefone</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px' }} colSpan="3">{order.phone || ''}</td>
              </tr>
            </tbody>
          </table>

          {/* Client Info */}
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '8px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '20%', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Cliente</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '30%' }}>{order.client_name || ''}</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '15%', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Unidade</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '35%' }}>{order.unit || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Endereço</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px' }} colSpan="3">{order.service_address || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Observações</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', minHeight: '30px' }} colSpan="3">{order.observations || ''}</td>
              </tr>
            </tbody>
          </table>

          {/* Equipment Info */}
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '8px 0 4px 0', textTransform: 'uppercase' }}>Informações do Equipamento</h3>
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '8px' }}>
            <tbody>
              {(order.equipment_type || order.equipment_brand || order.equipment_model) && (
                <tr>
                  <td style={{ border: '1px solid #000', padding: '3px 5px', width: '20%', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Equipamento</td>
                  <td style={{ border: '1px solid #000', padding: '3px 5px' }} colSpan="3">
                    {[order.equipment_type, order.equipment_brand, order.equipment_model].filter(Boolean).join(' - ')}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '20%', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>S/N Placa</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '30%' }}>{order.equipment_board_serial || ''}</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '20%', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>S/N Equipamento</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '30%' }}>{order.equipment_serial || ''}</td>
              </tr>
            </tbody>
          </table>

          {/* Call Info */}
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '8px 0 4px 0', textTransform: 'uppercase' }}>Informações do Chamado</h3>
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '8px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', minHeight: '40px', verticalAlign: 'top' }}>{order.call_info || ''}</td>
              </tr>
            </tbody>
          </table>

          {/* Materials */}
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '8px 0 4px 0', textTransform: 'uppercase' }}>Materiais</h3>
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '8px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', minHeight: '30px', verticalAlign: 'top' }}>
                  {order.materials || ''}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Technical Report */}
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '8px 0 4px 0', textTransform: 'uppercase' }}>Laudo Técnico</h3>
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '8px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', minHeight: '40px', verticalAlign: 'top' }}>
                  {order.technical_report || ''}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Verifications */}
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '8px 0 4px 0', textTransform: 'uppercase' }}>Verificações</h3>
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt', marginBottom: '8px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', padding: '3px 5px', backgroundColor: '#cbd5e1', textAlign: 'left' }}>Item Verificado</th>
                <th style={{ border: '1px solid #000', padding: '3px 5px', backgroundColor: '#cbd5e1', width: '15%', textAlign: 'center' }}>Situação</th>
                <th style={{ border: '1px solid #000', padding: '3px 5px', backgroundColor: '#cbd5e1', width: '30%', textAlign: 'left' }}>Observações</th>
              </tr>
            </thead>
            <tbody>
              {order.verifications && order.verifications.length > 0 ? (
                order.verifications.map((verification, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #000', padding: '2px 5px', fontSize: '7pt' }}>{verification.item}</td>
                    <td style={{ border: '1px solid #000', padding: '2px 5px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontSize: '7pt',
                        fontWeight: 'bold',
                        backgroundColor: verification.status === 'BOA' ? '#d1fae5' : verification.status === 'RUIM' ? '#fee2e2' : '#f1f5f9',
                        color: verification.status === 'BOA' ? '#065f46' : verification.status === 'RUIM' ? '#991b1b' : '#475569'
                      }}>
                        {verification.status}
                      </span>
                    </td>
                    <td style={{ border: '1px solid #000', padding: '2px 5px', fontSize: '7pt' }}>{verification.observation || ''}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#64748b' }}>Nenhuma verificação registrada</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Final Info */}
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '8px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '25%', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Contador Total Páginas</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '25%' }}>{order.total_page_count || ''}</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '25%', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Próxima Visita</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px', width: '25%' }}>{order.next_visit || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Pendências</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px' }} colSpan="3">{order.pending_issues || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '3px 5px', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>Equipamento Trocado</td>
                <td style={{ border: '1px solid #000', padding: '3px 5px' }} colSpan="3">{order.equipment_replaced ? 'SIM' : 'NÃO'}</td>
              </tr>
            </tbody>
          </table>

          {/* Declaration */}
          <div style={{ fontSize: '7.5pt', textAlign: 'justify', margin: '8px 0', padding: '5px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
            <p style={{ margin: 0 }}><strong>Declaração:</strong> Atesto que os serviços relacionados acima foram executados. Equipamento testado dentro e fora do sistema, funcionando perfeitamente.</p>
          </div>

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginTop: '40px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '8pt', fontWeight: 'bold' }}>Assinatura do Técnico</p>
                <p style={{ margin: '2px 0', fontSize: '7pt', color: '#64748b' }}>{order.responsible_tech || ''}</p>
                <p style={{ margin: '2px 0', fontSize: '7pt', color: '#64748b' }}>Data: ___/___/______</p>
              </div>
            </div>
            <div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginTop: '40px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '8pt', fontWeight: 'bold' }}>Assinatura do Cliente</p>
                <p style={{ margin: '2px 0', fontSize: '7pt', color: '#64748b' }}>Ciente do serviço executado</p>
                <p style={{ margin: '2px 0', fontSize: '7pt', color: '#64748b' }}>Data: ___/___/______</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ViewServiceOrder;
