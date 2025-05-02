// Simple authentication service

/**
 * Check if user is logged in
 */
export const isLoggedIn = (): boolean => {
  return localStorage.getItem("isLoggedIn") === "true";
};

/**
 * Login with username and password
 */
export const login = (username: string, password: string): boolean => {
  // In a real app, this would validate credentials against a backend
  // For now, we'll accept any non-empty username and password
  if (username && password) {
    localStorage.setItem("isLoggedIn", "true");
    return true;
  }
  return false;
};

/**
 * Logout the current user and redirect to login page
 */
export const logout = (): void => {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "/login";
};
