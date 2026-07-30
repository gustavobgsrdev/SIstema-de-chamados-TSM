import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { axiosInstance as axios } from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, PenTool } from "lucide-react";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.includes("/")) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const SignServiceOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("review"); // review -> client_sign -> tech_sign -> done
  const [clientName, setClientName] = useState("");
  const [techName, setTechName] = useState("");
  const [signing, setSigning] = useState(false);
  const canvasClientRef = useRef(null);
  const canvasTechRef = useRef(null);
  const [isDrawingClient, setIsDrawingClient] = useState(false);
  const [isDrawingTech, setIsDrawingTech] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await axios.get(`/service-orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error("Erro ao carregar chamado");
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const initCanvas = (canvasRef) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  useEffect(() => {
    if (step === "client_sign") {
      setTimeout(() => initCanvas(canvasClientRef), 100);
    }
    if (step === "tech_sign") {
      setTimeout(() => initCanvas(canvasTechRef), 100);
    }
  }, [step]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e, canvasRef, setDrawing) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const draw = (e, canvasRef, isDrawing) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = (setDrawing) => {
    setDrawing(false);
  };

  const clearCanvas = (canvasRef) => {
    initCanvas(canvasRef);
  };

  const handleSubmitSignatures = async () => {
    if (!clientName.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }
    if (!techName.trim()) {
      toast.error("Nome do técnico é obrigatório");
      return;
    }

    setSigning(true);
    try {
      const clientCanvas = canvasClientRef.current;
      const techCanvas = canvasTechRef.current;
      
      const clientSigData = clientCanvas ? clientCanvas.toDataURL("image/png") : "";
      const techSigData = techCanvas ? techCanvas.toDataURL("image/png") : "";

      await axios.put(`/service-orders/${id}/sign`, {
        client_signature: JSON.stringify({ name: clientName, signature: clientSigData }),
        tech_signature: JSON.stringify({ name: techName, signature: techSigData }),
      });

      toast.success("Assinaturas registradas com sucesso!");
      setStep("done");
    } catch (error) {
      toast.error("Erro ao salvar assinaturas");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) return null;

  // Step: Done
  if (step === "done") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Assinaturas Registradas!</h2>
          <p className="text-slate-600 mb-6">As assinaturas foram salvas com sucesso no chamado #{order.ticket_number}.</p>
          <Button onClick={() => navigate("/dashboard")} className="bg-blue-600 hover:bg-blue-700" data-testid="back-dashboard-button">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Step: Tech signature
  if (step === "tech_sign") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button onClick={() => setStep("client_sign")} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <img src="/tsm-logo.png" alt="TSM" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Assinatura do Técnico</h1>
                <p className="text-sm text-slate-600">Chamado #{order.ticket_number}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8 max-w-lg">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div>
              <Label>Nome do Técnico</Label>
              <Input
                value={techName}
                onChange={(e) => setTechName(e.target.value)}
                placeholder="Nome completo do técnico"
                data-testid="tech-name-input"
              />
            </div>
            <div>
              <Label>Assinatura do Técnico</Label>
              <div className="border-2 border-slate-300 rounded-lg mt-1 bg-white touch-none">
                <canvas
                  ref={canvasTechRef}
                  width={460}
                  height={180}
                  className="w-full cursor-crosshair"
                  data-testid="tech-signature-canvas"
                  onMouseDown={(e) => startDraw(e, canvasTechRef, setIsDrawingTech)}
                  onMouseMove={(e) => draw(e, canvasTechRef, isDrawingTech)}
                  onMouseUp={() => stopDraw(setIsDrawingTech)}
                  onMouseLeave={() => stopDraw(setIsDrawingTech)}
                  onTouchStart={(e) => startDraw(e, canvasTechRef, setIsDrawingTech)}
                  onTouchMove={(e) => draw(e, canvasTechRef, isDrawingTech)}
                  onTouchEnd={() => stopDraw(setIsDrawingTech)}
                />
              </div>
              <Button variant="link" size="sm" className="text-red-500 mt-1 p-0" onClick={() => clearCanvas(canvasTechRef)}>
                Limpar assinatura
              </Button>
            </div>
            <Button
              onClick={handleSubmitSignatures}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={signing}
              data-testid="confirm-signatures-button"
            >
              {signing ? "Salvando..." : "Confirmar Assinaturas"}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Step: Client signature
  if (step === "client_sign") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button onClick={() => setStep("review")} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <img src="/tsm-logo.png" alt="TSM" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Assinatura do Cliente</h1>
                <p className="text-sm text-slate-600">Chamado #{order.ticket_number}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8 max-w-lg">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div>
              <Label>Nome do Cliente</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome completo do cliente"
                data-testid="client-name-sign-input"
              />
            </div>
            <div>
              <Label>Assinatura do Cliente</Label>
              <div className="border-2 border-slate-300 rounded-lg mt-1 bg-white touch-none">
                <canvas
                  ref={canvasClientRef}
                  width={460}
                  height={180}
                  className="w-full cursor-crosshair"
                  data-testid="client-signature-canvas"
                  onMouseDown={(e) => startDraw(e, canvasClientRef, setIsDrawingClient)}
                  onMouseMove={(e) => draw(e, canvasClientRef, isDrawingClient)}
                  onMouseUp={() => stopDraw(setIsDrawingClient)}
                  onMouseLeave={() => stopDraw(setIsDrawingClient)}
                  onTouchStart={(e) => startDraw(e, canvasClientRef, setIsDrawingClient)}
                  onTouchMove={(e) => draw(e, canvasClientRef, isDrawingClient)}
                  onTouchEnd={() => stopDraw(setIsDrawingClient)}
                />
              </div>
              <Button variant="link" size="sm" className="text-red-500 mt-1 p-0" onClick={() => clearCanvas(canvasClientRef)}>
                Limpar assinatura
              </Button>
            </div>
            <Button
              onClick={() => setStep("tech_sign")}
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="next-tech-sign-button"
            >
              Próximo: Assinatura do Técnico
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Step: Review order data
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/dashboard")} variant="ghost" size="sm" data-testid="back-button">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <img src="/tsm-logo.png" alt="TSM" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">Revisão do Chamado</h1>
              <p className="text-sm text-slate-600">Revise os dados antes de assinar</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Informações Básicas */}
          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-3 border-b pb-2">Informações do Chamado</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-slate-600">Nº Chamado:</span> {order.ticket_number || "-"}</div>
              <div><span className="font-medium text-slate-600">Nº O.S.:</span> {order.os_number || "-"}</div>
              <div><span className="font-medium text-slate-600">PAT:</span> {order.pat || "-"}</div>
              <div><span className="font-medium text-slate-600">Situação:</span> {order.status || "-"}</div>
              <div><span className="font-medium text-slate-600">Abertura:</span> {formatDate(order.opening_date)}{order.opening_time ? ` às ${order.opening_time}` : ""}</div>
              <div><span className="font-medium text-slate-600">Atendimento:</span> {formatDate(order.service_date)}{order.service_time ? ` às ${order.service_time}` : ""}</div>
            </div>
          </div>

          {/* Cliente */}
          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-3 border-b pb-2">Cliente</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-slate-600">Cliente:</span> {order.client_name || "-"}</div>
              <div><span className="font-medium text-slate-600">Unidade:</span> {order.unit || "-"}</div>
              <div className="col-span-2"><span className="font-medium text-slate-600">Endereço:</span> {order.service_address || "-"}</div>
              <div><span className="font-medium text-slate-600">Telefone:</span> {order.phone || "-"}</div>
            </div>
          </div>

          {/* Equipamento */}
          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-3 border-b pb-2">Equipamento</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-slate-600">Tipo:</span> {order.equipment_type || "-"}</div>
              <div><span className="font-medium text-slate-600">Marca:</span> {order.equipment_brand || "-"}</div>
              <div><span className="font-medium text-slate-600">Modelo:</span> {order.equipment_model || "-"}</div>
              <div><span className="font-medium text-slate-600">S/N Equip.:</span> {order.equipment_serial || "-"}</div>
              <div><span className="font-medium text-slate-600">S/N Placa:</span> {order.equipment_board_serial || "-"}</div>
            </div>
          </div>

          {/* Serviço */}
          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-3 border-b pb-2">Serviço Realizado</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium text-slate-600">Descrição:</span> {order.call_info || "-"}</div>
              <div><span className="font-medium text-slate-600">Materiais:</span> {order.materials || "-"}</div>
              <div><span className="font-medium text-slate-600">Laudo Técnico:</span> {order.technical_report || "-"}</div>
              <div><span className="font-medium text-slate-600">Observações:</span> {order.observations || "-"}</div>
            </div>
          </div>

          {/* Verificações */}
          {order.verifications && order.verifications.length > 0 && order.verification_mode === "DIGITAL" && (
            <div>
              <h3 className="text-base font-semibold text-slate-800 mb-3 border-b pb-2">Verificações</h3>
              <div className="grid grid-cols-1 gap-1 text-sm">
                {order.verifications.map((v, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                    <span>{v.item}</span>
                    <span className={`font-medium ${v.status === "BOA" ? "text-green-600" : v.status === "RUIM" ? "text-red-600" : "text-slate-400"}`}>
                      {v.status}{v.observation ? ` - ${v.observation}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              onClick={() => setStep("client_sign")}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
              data-testid="proceed-sign-button"
            >
              <PenTool className="w-5 h-5 mr-2" />
              Prosseguir para Assinatura
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignServiceOrder;
