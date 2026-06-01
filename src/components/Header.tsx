import React from "react";
import { Home, Search, PlusCircle, Mail, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { User } from "../types";

interface HeaderProps {
  currentTab: string;
  setTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export default function Header({ currentTab, setTab, user, onLogout, onOpenAuth }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs" id="casaloc-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => setTab("home")}
            id="brand-logo"
          >
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-200 transition-all group-hover:scale-105">
              <span className="text-xl font-bold font-display">Cl</span>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-800 font-display">
                Casa<span className="text-emerald-600">loc</span>
              </span>
              <span className="block text-[9px] text-slate-400 font-bold tracking-wider -mt-1 uppercase">
                Bandundu RDC
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" id="desktop-nav">
            <button
              id="nav-home"
              onClick={() => setTab("home")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === "home"
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Home className="w-4 h-4" />
              Accueil
            </button>
            <button
              id="nav-browse"
              onClick={() => setTab("browse")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === "browse"
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Search className="w-4 h-4" />
              Trouver une maison
            </button>
            <button
              id="nav-publish"
              onClick={() => setTab("publish")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === "publish"
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Publier une annonce
            </button>
            <button
              id="nav-contact"
              onClick={() => setTab("contact")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === "contact"
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Mail className="w-4 h-4" />
              Contact
            </button>
          </nav>

          {/* User Session Interface */}
          <div className="flex items-center gap-3" id="auth-header-controls">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-800 line-clamp-1">{user.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Propriétaire</span>
                </div>
                <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-700 shadow-inner">
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Se déconnecter"
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-login-trigger"
                onClick={onOpenAuth}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Espace Membre</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
