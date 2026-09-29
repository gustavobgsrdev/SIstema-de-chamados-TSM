import { useState, useRef } from "react";
import { axiosInstance as axios } from "@/api/axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Trash2, FileText, Image as ImageIcon, File, Loader2 } from "lucide-react";

const FILE_ICONS = {
  "image/": ImageIcon,
  "application/pdf": FileText,
};

const getIcon = (contentType) => {
  for (const [prefix, Icon] of Object.entries(FILE_ICONS)) {
    if (contentType?.startsWith(prefix)) return Icon;
  }
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
    if (previews[attachment.id]) return;
    if (!attachment.content_type?.startsWith("image/")) return;
    try {
      const resp = await axios.get(`/files/${attachment.storage_path}`, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(resp.data);
      setPreviews((prev) => ({ ...prev, [attachment.id]: blobUrl }));
    } catch {
      // ignore
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
                className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 bg-slate-50"
                data-testid={`attachment-${att.id}`}
              >
                {isImage && previews[att.id] ? (
                  <img
                    src={previews[att.id]}
                    alt={att.filename}
                    className="w-12 h-12 object-cover rounded border"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-white rounded border">
                    <Icon className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{att.filename}</p>
                  <p className="text-xs text-slate-500">
                    {formatSize(att.size)} {att.created_at ? `• ${att.created_at}` : ""}
                  </p>
                </div>
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
            );
          })}
        </div>
      )}

      {attachments.length === 0 && readOnly && (
        <p className="text-sm text-slate-400">Nenhum anexo</p>
      )}
    </div>
  );
};

export default FileUpload;
