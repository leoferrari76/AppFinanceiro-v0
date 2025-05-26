import { supabase } from "@/lib/supabase";

export interface FinancialGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  group_members?: {
    user_id: string;
    role: "owner" | "member";
    users?: {
      email: string;
      user_metadata?: {
        name?: string;
      };
    };
  }[];
  summary?: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  };
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: string;
}

export interface GroupSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  memberCount: number;
}

export const createFinancialGroup = async (name: string, userId: string) => {
  try {
    console.log('Iniciando criação do grupo:', { name, userId });

    // Verificar se o usuário está autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Erro ao verificar usuário:', userError);
      throw new Error('Usuário não autenticado');
    }

    // Criar o grupo
    const { data: group, error: groupError } = await supabase
      .from("financial_groups")
      .insert([{ name, created_by: userId }])
      .select()
      .single();

    if (groupError) {
      console.error('Erro ao criar grupo:', groupError);
      throw new Error(groupError.message);
    }

    console.log('Grupo criado com sucesso:', group);

    // Adicionar o criador como membro do grupo
    const { error: memberError } = await supabase
      .from("group_members")
      .insert([{ group_id: group.id, user_id: userId, role: "owner" }]);

    if (memberError) {
      console.error('Erro ao adicionar membro:', memberError);
      throw new Error(memberError.message);
    }

    console.log('Membro adicionado com sucesso');

    // Buscar informações do usuário criador
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (creatorError) {
      console.error('Erro ao buscar informações do criador:', creatorError);
      return {
        ...group,
        group_members: [{
          user_id: userId,
          role: "owner",
          user: null
        }]
      };
    }

    // Retornar o grupo com as informações do criador
    return {
      ...group,
      group_members: [{
        user_id: userId,
        role: "owner",
        user: creator
      }],
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0
      }
    };
  } catch (error) {
    console.error("Erro ao criar grupo:", error);
    throw error;
  }
};

export const getFinancialGroups = async (userId: string) => {
  try {
    console.log('Iniciando busca de grupos para o usuário:', userId);
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Erro ao verificar usuário:', userError);
      throw new Error('Usuário não autenticado');
    }

    console.log('Usuário autenticado, buscando grupos...');
    
    // Primeiro, buscar os IDs dos grupos onde o usuário é membro
    const { data: memberGroups, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (memberError) {
      console.error('Erro ao buscar grupos do usuário:', memberError);
      throw new Error(memberError.message);
    }

    if (!memberGroups || memberGroups.length === 0) {
      console.log('Nenhum grupo encontrado');
      return [];
    }

    const groupIds = memberGroups.map(mg => mg.group_id);

    // Buscar os detalhes dos grupos
    const { data: groups, error: groupsError } = await supabase
      .from("financial_groups")
      .select("*")
      .in("id", groupIds);

    if (groupsError) {
      console.error('Erro ao buscar detalhes dos grupos:', groupsError);
      throw new Error(groupsError.message);
    }

    // Buscar os membros de cada grupo
    const groupsWithMembers = await Promise.all(groups.map(async (group) => {
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("user_id, role")
        .eq("group_id", group.id);

      if (membersError) {
        console.error('Erro ao buscar membros do grupo:', membersError);
        return group;
      }

      return {
        ...group,
        group_members: members
      };
    }));

    // Buscar informações dos usuários
    const allMemberIds = groupsWithMembers
      .flatMap(group => group.group_members?.map(member => member.user_id) || [])
      .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicatas

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', allMemberIds);

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError);
      return groupsWithMembers;
    }

    // Mapear informações dos usuários para os membros
    const groupsWithUsers = groupsWithMembers.map(group => ({
      ...group,
      group_members: group.group_members?.map(member => ({
        ...member,
        user: users?.find(user => user.id === member.user_id)
      }))
    }));

    // Adicionar resumo para cada grupo
    const groupsWithSummary = await Promise.all(groupsWithUsers.map(async (group) => {
      // Buscar transações do grupo
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("group_id", group.id);

      if (transactionsError) {
        console.error('Erro ao buscar transações do grupo:', transactionsError);
        return {
          ...group,
          summary: {
            totalIncome: 0,
            totalExpenses: 0,
            balance: 0
          }
        };
      }

      const summary = {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0
      };

      if (transactions) {
        transactions.forEach(transaction => {
          if (transaction.type === 'income') {
            summary.totalIncome += transaction.amount;
          } else {
            summary.totalExpenses += transaction.amount;
          }
        });
        summary.balance = summary.totalIncome - summary.totalExpenses;
      }

      return {
        ...group,
        summary
      };
    }));

    console.log('Grupos com resumo:', groupsWithSummary);
    return groupsWithSummary;
  } catch (error) {
    console.error("Erro ao buscar grupos:", error);
    throw error;
  }
};

export const inviteToGroup = async (groupId: string, email: string) => {
  try {
    console.log('Iniciando convite para o grupo:', { groupId, email });

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError) {
      console.error('Erro ao verificar usuário:', userError);
      throw new Error('Usuário não encontrado');
    }

    // Verificar se o usuário já é membro do grupo
    const { data: existingMember, error: checkError } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      throw new Error('Usuário já é membro deste grupo');
    }

    // Adicionar o usuário como membro do grupo
    const { error: memberError } = await supabase
      .from("group_members")
      .insert([{ group_id: groupId, user_id: user.id, role: "member" }]);

    if (memberError) {
      console.error('Erro ao adicionar membro:', memberError);
      throw new Error(memberError.message);
    }

    console.log('Membro adicionado com sucesso');
    return true;
  } catch (error) {
    console.error("Erro ao convidar membro:", error);
    throw error;
  }
}; 