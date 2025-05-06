import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { LogIn, UserPlus, Eye, EyeOff, Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  // Registration state
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
    passwordsMatch: false,
  });

  // Password strength calculation
  const calculatePasswordStrength = () => {
    const { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecial } =
      passwordValidation;
    const validCount = [
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
    ].filter(Boolean).length;
    return (validCount / 5) * 100;
  };

  // Update password validation on password change
  useEffect(() => {
    setPasswordValidation({
      minLength: registerPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(registerPassword),
      hasLowercase: /[a-z]/.test(registerPassword),
      hasNumber: /[0-9]/.test(registerPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(registerPassword),
      passwordsMatch:
        registerPassword === confirmPassword && registerPassword !== "",
    });
  }, [registerPassword, confirmPassword]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simple validation
    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      // If successful, the auth state will update and redirect in App.tsx
      navigate("/");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setIsRegisterLoading(true);

    // Validate all fields are filled
    if (!fullName || !registerEmail || !registerPassword) {
      setRegisterError("Please fill in all required fields");
      setIsRegisterLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerEmail)) {
      setRegisterError("Please enter a valid email address");
      setIsRegisterLoading(false);
      return;
    }

    // Validate password meets all requirements
    const {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      passwordsMatch,
    } = passwordValidation;
    if (
      !minLength ||
      !hasUppercase ||
      !hasLowercase ||
      !hasNumber ||
      !hasSpecial
    ) {
      setRegisterError("Password does not meet all requirements");
      setIsRegisterLoading(false);
      return;
    }

    // Validate passwords match if confirm password is provided
    if (confirmPassword && !passwordsMatch) {
      setRegisterError("Passwords do not match");
      setIsRegisterLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await signUp(
        registerEmail,
        registerPassword,
        { full_name: fullName },
      );

      if (signUpError) {
        setRegisterError(signUpError.message);
        setIsRegisterLoading(false);
        return;
      }

      // If successful, show confirmation message and allow immediate login
      setRegisterError(
        "Registration successful! You can now log in with your credentials.",
      );

      // Clear registration form and switch to login tab
      setFullName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");

      // Auto-switch to login tab
      document
        .querySelector('[value="login"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      // You could also automatically switch to the login tab here
    } catch (err) {
      setRegisterError("An unexpected error occurred. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setIsRegisterLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing In...
                    </span>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" /> Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                {registerError && (
                  <div
                    className={`p-3 text-sm rounded ${registerError.includes("successful") ? "bg-green-100 border border-green-400 text-green-700" : "bg-red-100 border border-red-400 text-red-700"}`}
                  >
                    {registerError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    aria-required="true"
                    disabled={isRegisterLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registerEmail">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="registerEmail"
                    type="email"
                    placeholder="Enter your email address"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    aria-required="true"
                    disabled={isRegisterLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registerPassword">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="registerPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      aria-required="true"
                      className="pr-10"
                      disabled={isRegisterLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password strength indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Password strength:</span>
                    <span>
                      {calculatePasswordStrength() <= 20 && "Very Weak"}
                      {calculatePasswordStrength() > 20 &&
                        calculatePasswordStrength() <= 40 &&
                        "Weak"}
                      {calculatePasswordStrength() > 40 &&
                        calculatePasswordStrength() <= 60 &&
                        "Medium"}
                      {calculatePasswordStrength() > 60 &&
                        calculatePasswordStrength() <= 80 &&
                        "Strong"}
                      {calculatePasswordStrength() > 80 && "Very Strong"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        calculatePasswordStrength() <= 20
                          ? "bg-red-500"
                          : calculatePasswordStrength() <= 40
                            ? "bg-orange-500"
                            : calculatePasswordStrength() <= 60
                              ? "bg-yellow-500"
                              : calculatePasswordStrength() <= 80
                                ? "bg-blue-500"
                                : "bg-green-500"
                      }`}
                      style={{ width: `${calculatePasswordStrength()}%` }}
                    ></div>
                  </div>
                </div>

                {/* Password requirements checklist */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    {passwordValidation.minLength ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span>At least 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {passwordValidation.hasUppercase ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span>At least one uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {passwordValidation.hasLowercase ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span>At least one lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {passwordValidation.hasNumber ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span>At least one number</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {passwordValidation.hasSpecial ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span>At least one special character</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isRegisterLoading}
                  />
                  {confirmPassword && (
                    <div className="flex items-center gap-1 text-xs mt-1">
                      {passwordValidation.passwordsMatch ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                      <span>
                        {passwordValidation.passwordsMatch
                          ? "Passwords match"
                          : "Passwords do not match"}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isRegisterLoading}
                >
                  {isRegisterLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" /> Create Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
