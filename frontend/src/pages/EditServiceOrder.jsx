import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VERIFICATION_ITEMS = [
  "IMPRESSÃO/XEROX",
  "DIGITALIZAÇÃO",
  "REDE/USB",
  "ADF / DUPLEX (ADF)",
  "TIPO CONEXÃO - REDE/WIFI/USB",
  "PAINEL/APARDOR DE PAPEL",
  "PELICULA FUSORA/ROLO PRESSOR/ROLO FUSOR",
  "PICK ROLER BAND 1/2",
  "BANDEJA 1/2",
  "ETIQUETAS DE IDENTIFICAÇÃO",
  "PATRIMONIO",
  "CABO FORÇA E USB",
  "CARTUCHO SOBRESSALENTE"
];

const EditServiceOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/service-orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Ensure verifications exist
      if (!response.data.verifications || response.data.verifications.length === 0) {
        response.data.verifications = VERIFICATION_ITEMS.map(item => ({
          item,
          status: "N/A",
          observation: ""
        }));
      }
      
      setFormData(response.data);
    } catch (error) {
      toast.error("Erro ao carregar O.S.");
      navigate("/dashboard");
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/service-orders/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("O.S. atualizada com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Erro ao atualizar O.S.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateVerification = (index, field, value) => {
    const newVerifications = [...formData.verifications];
    newVerifications[index][field] = value;
    setFormData({ ...formData, verifications: newVerifications });
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 py-4">
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
            <img src="/tsm-logo.png" alt="TSM Printer Solutions" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">Editar Ordem de Serviço</h1>
              <p className="text-sm text-slate-600">O.S. #{formData.os_number || "S/N"}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações Básicas</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ticket_number">Nº do Chamado</Label>
                <Input
                  id="ticket_number"
                  value={formData.ticket_number || ""}
                  onChange={(e) => updateField("ticket_number", e.target.value)}
                  data-testid="ticket-number-input"
                />
              </div>
              <div>
                <Label htmlFor="os_number">Nº da O.S.</Label>
                <Input
                  id="os_number"
                  value={formData.os_number || ""}
                  onChange={(e) => updateField("os_number", e.target.value)}
                  data-testid="os-number-input"
                />
              </div>
              <div>
                <Label htmlFor="pat">PAT</Label>
                <Input
                  id="pat"
                  value={formData.pat || ""}
                  onChange={(e) => updateField("pat", e.target.value)}
                  data-testid="pat-input"
                />
              </div>
              <div>
                <Label htmlFor="opening_date">Data de Abertura</Label>
                <Input
                  id="opening_date"
                  type="date"
                  value={formData.opening_date || ""}
                  onChange={(e) => updateField("opening_date", e.target.value)}
                  data-testid="opening-date-input"
                />
              </div>
              <div>
                <Label htmlFor="responsible_opening">Responsável Abertura</Label>
                <Input
                  id="responsible_opening"
                  value={formData.responsible_opening || ""}
                  onChange={(e) => updateField("responsible_opening", e.target.value)}
                  data-testid="responsible-opening-input"
                />
              </div>
              <div>
                <Label htmlFor="responsible_tech">Técnico Responsável</Label>
                <Input
                  id="responsible_tech"
                  value={formData.responsible_tech || ""}
                  onChange={(e) => updateField("responsible_tech", e.target.value)}
                  data-testid="responsible-tech-input"
                />
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Dados do Cliente</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Cliente</Label>
                <Input
                  id="client_name"
                  value={formData.client_name || ""}
                  onChange={(e) => updateField("client_name", e.target.value)}
                  data-testid="client-name-input"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                  data-testid="phone-input"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unidade</Label>
                <Input
                  id="unit"
                  value={formData.unit || ""}
                  onChange={(e) => updateField("unit", e.target.value)}
                  data-testid="unit-input"
                />
              </div>
              <div>
                <Label htmlFor="service_address">Endereço de Atendimento</Label>
                <Input
                  id="service_address"
                  value={formData.service_address || ""}
                  onChange={(e) => updateField("service_address", e.target.value)}
                  data-testid="service-address-input"
                />
              </div>
            </div>
          </div>

          {/* Equipamento */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações do Equipamento</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="equipment_type">Tipo de Equipamento</Label>
                <Input
                  id="equipment_type"
                  placeholder="Ex: IMPRESSORA"
                  value={formData.equipment_type || ""}
                  onChange={(e) => updateField("equipment_type", e.target.value)}
                  data-testid="equipment-type-input"
                />
              </div>
              <div>
                <Label htmlFor="equipment_brand">Marca</Label>
                <Input
                  id="equipment_brand"
                  placeholder="Ex: SAMSUNG"
                  value={formData.equipment_brand || ""}
                  onChange={(e) => updateField("equipment_brand", e.target.value)}
                  data-testid="equipment-brand-input"
                />
              </div>
              <div>
                <Label htmlFor="equipment_model">Modelo</Label>
                <Input
                  id="equipment_model"
                  placeholder="Ex: M4070FR"
                  value={formData.equipment_model || ""}
                  onChange={(e) => updateField("equipment_model", e.target.value)}
                  data-testid="equipment-model-input"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipment_board_serial">S/N Placa</Label>
                <Input
                  id="equipment_board_serial"
                  value={formData.equipment_board_serial || ""}
                  onChange={(e) => updateField("equipment_board_serial", e.target.value)}
                  data-testid="equipment-board-serial-input"
                />
              </div>
              <div>
                <Label htmlFor="equipment_serial">S/N Equipamento</Label>
                <Input
                  id="equipment_serial"
                  value={formData.equipment_serial || ""}
                  onChange={(e) => updateField("equipment_serial", e.target.value)}
                  data-testid="equipment-serial-input"
                />
              </div>
            </div>
          </div>

          {/* Chamado */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações do Chamado</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="call_info">Descrição do Chamado</Label>
                <Textarea
                  id="call_info"
                  value={formData.call_info || ""}
                  onChange={(e) => updateField("call_info", e.target.value)}
                  rows={3}
                  data-testid="call-info-input"
                />
              </div>
            </div>
          </div>

          {/* Materiais e Laudo Técnico */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Materiais e Laudo Técnico</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="materials">Materiais Utilizados</Label>
                <Textarea
                  id="materials"
                  placeholder="Liste os materiais utilizados no atendimento"
                  value={formData.materials || ""}
                  onChange={(e) => updateField("materials", e.target.value)}
                  rows={3}
                  data-testid="materials-input"
                />
              </div>
              <div>
                <Label htmlFor="technical_report">Laudo Técnico (Preenchido após manutenção)</Label>
                <Textarea
                  id="technical_report"
                  placeholder="Laudo técnico será preenchido após a conclusão do serviço"
                  value={formData.technical_report || ""}
                  onChange={(e) => updateField("technical_report", e.target.value)}
                  rows={4}
                  data-testid="technical-report-input"
                />
              </div>
            </div>
          </div>

          {/* Verificações */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Verificações</h2>
            <div className="space-y-4">
              {formData.verifications.map((verification, index) => (
                <div key={index} className="grid md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="md:col-span-1 flex items-center">
                    <Label className="text-sm font-medium">{verification.item}</Label>
                  </div>
                  <div>
                    <Select
                      value={verification.status}
                      onValueChange={(value) => updateVerification(index, "status", value)}
                    >
                      <SelectTrigger data-testid={`verification-status-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOA">BOA</SelectItem>
                        <SelectItem value="RUIM">RUIM</SelectItem>
                        <SelectItem value="N/A">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input
                      placeholder="Observação"
                      value={verification.observation || ""}
                      onChange={(e) => updateVerification(index, "observation", e.target.value)}
                      data-testid={`verification-observation-${index}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Informações Finais */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações Finais</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total_page_count">Contador Total de Páginas</Label>
                <Input
                  id="total_page_count"
                  value={formData.total_page_count || ""}
                  onChange={(e) => updateField("total_page_count", e.target.value)}
                  data-testid="total-page-count-input"
                />
              </div>
              <div>
                <Label htmlFor="next_visit">Próxima Visita</Label>
                <Input
                  id="next_visit"
                  type="date"
                  value={formData.next_visit || ""}
                  onChange={(e) => updateField("next_visit", e.target.value)}
                  data-testid="next-visit-input"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="pending_issues">Pendências</Label>
                <Textarea
                  id="pending_issues"
                  value={formData.pending_issues || ""}
                  onChange={(e) => updateField("pending_issues", e.target.value)}
                  rows={2}
                  data-testid="pending-issues-input"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="observations">Observações Gerais</Label>
                <Textarea
                  id="observations"
                  value={formData.observations || ""}
                  onChange={(e) => updateField("observations", e.target.value)}
                  rows={3}
                  data-testid="observations-input"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="equipment_replaced"
                  checked={formData.equipment_replaced || false}
                  onChange={(e) => updateField("equipment_replaced", e.target.checked)}
                  className="w-4 h-4"
                  data-testid="equipment-replaced-checkbox"
                />
                <Label htmlFor="equipment_replaced" className="cursor-pointer">
                  Equipamento foi trocado
                </Label>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              onClick={() => navigate("/dashboard")}
              variant="outline"
              data-testid="cancel-button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
              data-testid="update-order-button"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditServiceOrder;
