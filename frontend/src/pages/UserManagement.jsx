import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance as axios } from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Shield, User as UserIcon, Edit, Check } from "lucide-react";

const DEPARTMENTS = ["Técnica", "Logística", "Comercial", "Financeiro"];

const DepartmentSelector = ({ selected, onChange, testIdPrefix }) => {
  const toggle = (dept) => {
    if (selected.includes(dept)) {
      onChange(selected.filter(d => d !== dept));
    } else {
      onChange([...selected, dept]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {DEPARTMENTS.map((dept) => {
        const isActive = selected.includes(dept);
        return (
          <button
            key={dept}
            type="button"
            onClick={() => toggle(dept)}
            data-testid={`${testIdPrefix}-dept-${dept.toLowerCase()}`}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isActive
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            {isActive && <Check className="w-3 h-3" />}
            {dept}
          </button>
        );
      })}
    </div>
  );
};

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "USER",
    departments: []
  });
  const [editFormData, setEditFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "USER",
    departments: []
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role !== "ADMIN") {
        toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
        navigate("/dashboard");
        return;
      }
    }
    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      const response = await axios.get(`/users`);
      setUsers(response.data);
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error("Erro ao carregar usuários");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`/auth/register`, formData);

      toast.success("Usuário criado com sucesso!");
      setShowCreateForm(false);
      setFormData({ email: "", password: "", name: "", role: "USER", departments: [] });
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email,
      password: "",
      name: user.name,
      role: user.role,
      departments: user.departments || []
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
        role: editFormData.role,
        departments: editFormData.departments
      };
      
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      await axios.put(`/users/${editingUser.id}`, updateData);

      toast.success("Usuário atualizado com sucesso!");
      setShowEditForm(false);
      setEditingUser(null);
      setEditFormData({ email: "", password: "", name: "", role: "USER", departments: [] });
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao atualizar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Deseja realmente excluir este usuário?")) return;

    try {
      await axios.delete(`/users/${userId}`);
      toast.success("Usuário excluído com sucesso");
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao excluir usuário");
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
      <header className="bg-white border-b border-slate-200">
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
              <img src="/tsm-logo.png" alt="TSM Printer Solutions" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Gerenciamento de Usuários</h1>
                <p className="text-sm text-slate-600">Área Administrativa</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="toggle-create-form"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showCreateForm ? "Cancelar" : "Novo Usuário"}
          </Button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Criar Novo Usuário</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="user-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Usuário (Login)</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="user-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="user-password-input"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Tipo de Acesso</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger data-testid="user-role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Usuário Padrão</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Departamentos</Label>
                <div className="mt-1">
                  <DepartmentSelector
                    selected={formData.departments}
                    onChange={(deps) => setFormData({ ...formData, departments: deps })}
                    testIdPrefix="create"
                  />
                </div>
              </div>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" data-testid="create-user-button">
                Criar Usuário
              </Button>
            </form>
          </div>
        )}

        {showEditForm && editingUser && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar Usuário</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Nome Completo</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    data-testid="edit-user-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Usuário (Login)</Label>
                  <Input
                    id="edit-email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    required
                    data-testid="edit-user-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-password">Nova Senha (deixe em branco para manter)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    placeholder="••••••••"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    data-testid="edit-user-password-input"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">Tipo de Acesso</Label>
                  <Select value={editFormData.role} onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}>
                    <SelectTrigger data-testid="edit-user-role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Usuário Padrão</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Departamentos</Label>
                <div className="mt-1">
                  <DepartmentSelector
                    selected={editFormData.departments}
                    onChange={(deps) => setEditFormData({ ...editFormData, departments: deps })}
                    testIdPrefix="edit"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="update-user-button">
                  Atualizar Usuário
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingUser(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Departamentos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Data Criação</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} data-testid={`user-row-${user.id}`}>
                  <td className="px-6 py-4 text-sm text-slate-800">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      user.role === "ADMIN" 
                        ? "bg-purple-100 text-purple-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {user.role === "ADMIN" ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                      {user.role === "ADMIN" ? "Admin" : "Usuário"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(user.departments || []).length > 0 ? (
                        user.departments.map((dept) => (
                          <span
                            key={dept}
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {dept}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        onClick={() => handleEdit(user)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        data-testid={`edit-user-${user.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(user.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-user-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
