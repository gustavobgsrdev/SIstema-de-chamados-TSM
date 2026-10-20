import { useState, useRef } from "react";
import { axiosInstance as axios } from "@/api/axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Trash2, FileText, Image as ImageIcon, File, Loader2, Download, Eye, X } from "lucide-react";

const getIcon = (contentType) => {
  if (contentType?.startsWith("image/")) return ImageIcon;
  if (contentType?.includes("pdf")) return FileText;
  return File;
};

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileUpload = ({ orderId, attachments = [], onUpdate, readOnly = false }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [previews, setPreviews] = useState({});
  const [lightbox, setLightbox] = useState(null);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    let uploaded = 0;

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        await axios.post(`/service-orders/${orderId}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploaded++;
      } catch (error) {
        toast.error(`Erro ao enviar ${file.name}`);
      }
    }

    if (uploaded > 0) {
      toast.success(`${uploaded} arquivo(s) enviado(s)`);
      if (onUpdate) onUpdate();
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (attachmentId) => {
    if (!window.confirm("Remover este anexo?")) return;
    try {
      await axios.delete(`/service-orders/${orderId}/attachments/${attachmentId}`);
      toast.success("Anexo removido");
      if (onUpdate) onUpdate();
    } catch {
      toast.error("Erro ao remover anexo");
    }
  };

  const loadPreview = async (attachment) => {
    if (previews[attachment.id]) return previews[attachment.id];
    if (!attachment.content_type?.startsWith("image/")) return null;
    try {
      const resp = await axios.get(`/files/${attachment.storage_path}`, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(resp.data);
      setPreviews((prev) => ({ ...prev, [attachment.id]: blobUrl }));
      return blobUrl;
    } catch {
      return null;
    }
  };

  const handleOpen = async (att) => {
    const isImage = att.content_type?.startsWith("image/");

    try {
      if (isImage) {
        let url = previews[att.id];
        if (!url) {
          url = await loadPreview(att);
        }
        if (url) {
          setLightbox({ url, filename: att.filename });
        }
      } else {
        const resp = await axios.get(`/files/${att.storage_path}`, { responseType: "blob" });
        const blob = new Blob([resp.data], { type: att.content_type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = att.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      toast.error("Erro ao abrir arquivo");
    }
  };

  const handleDownload = async (att) => {
    try {
      const resp = await axios.get(`/files/${att.storage_path}`, { responseType: "blob" });
      const blob = new Blob([resp.data], { type: att.content_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar arquivo");
    }
  };

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            data-testid="file-upload-input"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            data-testid="upload-button"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? "Enviando..." : "Anexar Arquivos"}
          </Button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => {
            const Icon = getIcon(att.content_type);
            const isImage = att.content_type?.startsWith("image/");

            if (isImage && !previews[att.id]) {
              loadPreview(att);
            }

            return (
              <div
                key={att.id}
                className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                data-testid={`attachment-${att.id}`}
              >
                <div
                  className="cursor-pointer flex-shrink-0"
                  onClick={() => handleOpen(att)}
                >
                  {isImage && previews[att.id] ? (
                    <img
                      src={previews[att.id]}
                      alt={att.filename}
                      className="w-12 h-12 object-cover rounded border hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-white rounded border hover:bg-blue-50 transition-colors">
                      <Icon className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleOpen(att)}
                >
                  <p className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate underline underline-offset-2">
                    {att.filename}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatSize(att.size)} {att.created_at ? `• ${att.created_at}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => handleOpen(att)}
                    title={isImage ? "Visualizar" : "Abrir"}
                    data-testid={`view-attachment-${att.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-slate-700"
                    onClick={() => handleDownload(att)}
                    title="Baixar"
                    data-testid={`download-attachment-${att.id}`}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(att.id)}
                      data-testid={`delete-attachment-${att.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {attachments.length === 0 && readOnly && (
        <p className="text-sm text-slate-400">Nenhum anexo</p>
      )}

      {/* Lightbox para imagens */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          data-testid="image-lightbox"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 transition-colors"
              data-testid="close-lightbox"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={lightbox.url}
              alt={lightbox.filename}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            <p className="text-center text-white text-sm mt-2">{lightbox.filename}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
