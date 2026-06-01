import React, { useState } from "react";
import { Mail, Lock, User as UserIcon, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { User } from "../types";

interface AuthProps {
  onAuthSuccess: (token: string, user: User) => void;
  onClose: () => void;
  initialMode?: "login" | "register" | "forgot";
}

export default function Auth({ onAuthSuccess, onClose, initialMode = "login" }: AuthProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Forgot / Reset password state
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [demoTokenMessage, setDemoTokenMessage] = useState<string | null>(null);
  const [demoResetLink, setDemoResetLink] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur de connexion");

        setSuccess(data.message || "Connexion réussie");
        setTimeout(() => {
          onAuthSuccess(data.token, data.user);
        }, 1200);

      } else if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur d'inscription");

        setSuccess(data.message || "Compte créé");
        setTimeout(() => {
          onAuthSuccess(data.token, data.user);
        }, 1200);

      } else if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Une erreur s'est produite");

        setSuccess(data.message);
        setDemoTokenMessage(data.token);
        setDemoResetLink(data.mockLink);

      } else if (mode === "reset") {
        const res = await fetch("/api/auth/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token: resetToken, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Code invalide ou expiré");

        setSuccess(data.message);
        setTimeout(() => {
          setMode("login");
          setPassword("");
          setError(null);
          setSuccess(null);
          setDemoTokenMessage(null);
          setDemoResetLink(null);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoResetClick = (tokenValue: string) => {
    setResetToken(tokenValue);
    setMode("reset");
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-slate-100 shadow-xl rounded-2xl p-8" id="auth-box-container">
      {/* Title / Back navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="btn-auth-back"
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Secured DB: SQLite
        </span>
      </div>

      {/* Title Heading */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 font-display" id="auth-title">
          {mode === "login" && "Bienvenue sur Casaloc"}
          {mode === "register" && "Créer un compte gratuitement"}
          {mode === "forgot" && "Mot de passe oublié"}
          {mode === "reset" && "Définir un nouveau mot de passe"}
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium font-sans">
          {mode === "login" && "Connectez-vous pour publier et gérer vos annonces"}
          {mode === "register" && "Obtenez un accès complet à l'immobilier de Bandundu"}
          {mode === "forgot" && "Saisissez votre e-mail pour recevoir le code de réinitialisation"}
          {mode === "reset" && "Entrez votre code de test et modifiez votre mot de passe"}
        </p>
      </div>

      {/* Response Messages */}
      {error && (
        <div id="auth-error-msg" className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 font-medium text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div id="auth-success-msg" className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-medium text-xs">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Demo helper toast for test users */}
      {mode === "forgot" && demoTokenMessage && (
        <div id="demo-mock-mailbox" className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <h4 className="font-bold flex items-center gap-1 text-amber-800 mb-1">
            <KeyRound className="w-4 h-4 text-amber-600" />
            [SIMULATEUR EMAIL] Casaloc Mailer
          </h4>
          <p className="mb-3 leading-relaxed">
            Un e-mail de réinitialisation a été intercepté pour la démo de l'applet !
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-md border border-amber-100">
              <span className="font-mono font-bold text-amber-700 text-sm">Code : {demoTokenMessage}</span>
            </div>
            <button
              id="btn-auth-demo-resolve"
              type="button"
              onClick={() => handleDemoResetClick(demoTokenMessage)}
              className="w-full text-center py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-all"
            >
              Cliquer ici pour entrer le code automatiquement
            </button>
          </div>
        </div>
      )}

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
        {mode === "register" && (
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Nom complet
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="auth-input-name"
                type="text"
                required
                placeholder="Ex. Grace Ndwite"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Adresse email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="auth-input-email"
              type="email"
              required
              placeholder="votre-nom@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
          </div>
        </div>

        {mode === "reset" && (
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Code de sécurité reçu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="auth-input-token"
                type="text"
                required
                maxLength={6}
                placeholder="Entrez le code à 6 chiffres"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
            </div>
          </div>
        )}

        {(mode === "login" || mode === "register" || mode === "reset") && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                {mode === "reset" ? "Nouveau mot de passe" : "Mot de passe"}
              </label>
              {mode === "login" && (
                <button
                  id="btn-goto-forgot"
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-bold"
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="auth-input-password"
                type="password"
                required
                placeholder={mode === "reset" ? "Saisissez 6 caractères min." : "Saisissez votre mot de passe"}
                value={mode === "reset" ? newPassword : password}
                onChange={(e) => mode === "reset" ? setNewPassword(e.target.value) : setPassword(e.target.value)}
                className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
            </div>
          </div>
        )}

        <button
          id="btn-auth-submit"
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer mt-4"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {mode === "login" && "Se connecter"}
              {mode === "register" && "Créer mon compte"}
              {mode === "forgot" && "Envoyer le code"}
              {mode === "reset" && "Valider et modifier"}
            </>
          )}
        </button>
      </form>

      {/* Toggles underneath */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-500 font-medium">
        {mode === "login" && (
          <p>
            Nouveau sur Casaloc ?{" "}
            <button
              id="btn-goto-register"
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
                setSuccess(null);
              }}
              className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Inscrivez-vous gratuitement
            </button>
          </p>
        )}

        {mode === "register" && (
          <p>
            Vous avez déjà un compte ?{" "}
            <button
              id="btn-goto-login"
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
              className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Se connecter
            </button>
          </p>
        )}

        {(mode === "forgot" || mode === "reset") && (
          <button
            id="btn-forgot-goto-login"
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setSuccess(null);
              setDemoTokenMessage(null);
              setDemoResetLink(null);
            }}
            className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
          >
            Retourner à l'écran de connexion
          </button>
        )}
      </div>
    </div>
  );
}
