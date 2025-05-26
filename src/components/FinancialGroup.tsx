import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Plus, UserPlus, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createFinancialGroup, getFinancialGroups, inviteToGroup, FinancialGroup as IFinancialGroup, GroupMember } from "@/services/financialGroups";

interface FinancialGroupProps {
  userId: string;
  onShareGroup?: (groupId: string) => void;
}

interface GroupSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  memberCount: number;
}

const FinancialGroup: React.FC<FinancialGroupProps> = ({
  userId,
  onShareGroup,
}) => {
  const { user } = useAuth();
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<IFinancialGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('Iniciando carregamento de grupos para usuário:', user.id);
      const data = await getFinancialGroups(user.id);
      console.log('Grupos carregados:', data);
      setGroups(data);
    } catch (error: any) {
      console.error('Erro ao carregar grupos:', error);
      setError(error.message || 'Não foi possível carregar os grupos');
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar os grupos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome para o grupo",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Criando grupo:', { name: groupName, userId: user.id });
      const newGroup = await createFinancialGroup(groupName, user.id);
      console.log('Grupo criado:', newGroup);
      
      // Recarregar todos os grupos após criar um novo
      await loadGroups();
      
      toast({
        title: "Sucesso",
        description: "Grupo criado com sucesso",
      });
      
      setIsCreateGroupOpen(false);
      setGroupName("");
    } catch (error: any) {
      console.error('Erro ao criar grupo:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o grupo",
        variant: "destructive",
      });
    }
  };

  const handleInviteMember = async () => {
    if (!selectedGroup || !inviteEmail.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido",
        variant: "destructive",
      });
      return;
    }

    try {
      await inviteToGroup(selectedGroup, inviteEmail);
      
      toast({
        title: "Sucesso",
        description: "Convite enviado com sucesso",
      });
      
      setIsInviteOpen(false);
      setInviteEmail("");
      loadGroups(); // Recarregar grupos para atualizar a lista de membros
    } catch (error) {
      console.error('Erro ao convidar membro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o convite",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando grupos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadGroups}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Grupos Financeiros</h2>
        <Button onClick={() => setIsCreateGroupOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Grupo
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground mb-4">Você ainda não tem nenhum grupo financeiro</p>
          <Button onClick={() => setIsCreateGroupOpen(true)}>
            Criar meu primeiro grupo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedGroup(group.id);
                      setIsInviteOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {group.group_members?.length || 0} membros
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Receitas</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(group.summary?.totalIncome || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Despesas</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(group.summary?.totalExpenses || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">Saldo</span>
                      <span className={`font-medium ${
                        (group.summary?.balance || 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {formatCurrency(group.summary?.balance || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {group.group_members?.map((member: any) => (
                      <Badge
                        key={member.user_id}
                        variant={member.role === "owner" ? "default" : "secondary"}
                      >
                        {member.users?.user_metadata?.name || member.users?.email}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação de Grupo */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Grupo</label>
              <Input
                placeholder="Ex: Casa, Viagem, etc."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGroup}>Criar Grupo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Convite */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email do Membro</label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInviteMember}>Enviar Convite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialGroup; 