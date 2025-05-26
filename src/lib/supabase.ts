import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase: Iniciando configuração');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase: Erro - URL ou chave anônima ausentes');
  throw new Error("Missing Supabase URL or Anonymous Key");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase: Cliente criado com sucesso');

export { supabase };
