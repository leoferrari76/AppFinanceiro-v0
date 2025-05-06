// Authentication service that uses Supabase
import { supabase } from "../lib/supabase";

/**
 * Check if user is logged in by checking Supabase session
 */
export const isLoggedIn = async (): Promise<boolean> => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

/**
 * Login with username and password
 * This is a legacy function and should be replaced with AuthContext's signIn
 */
export const login = async (
  email: string,
  password: string,
): Promise<boolean> => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
};

/**
 * Logout the current user and redirect to login page
 */
export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
  window.location.href = "/login";
};
