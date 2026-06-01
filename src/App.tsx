import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, MapPin, CheckCircle, Home, Mail, ShieldAlert, Heart, Calendar } from "lucide-react";

import Header from "./components/Header";
import Hero from "./components/Hero";
import Listings from "./components/Listings";
import AddListing from "./components/AddListing";
import Contact from "./components/Contact";
import Auth from "./components/Auth";
import { User, Listing } from "./types";

export default function App() {
  const [currentTab, setTab] = useState<string>("home");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<"login" | "register" | "forgot">("login");

  const [listings, setListings] = useState<Listing[]>([]);
  const [appNotification, setAppNotification] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // Sync token from localStorage and fetch current profile & listings
  useEffect(() => {
    const savedToken = localStorage.getItem("casaloc_token");
    if (savedToken) {
      setToken(savedToken);
      fetchUserProfile(savedToken);
    }
    fetchListings();
  }, []);

  const showNotification = (message: string, type: "success" | "info" | "error" = "success") => {
    setAppNotification({ message, type });
    setTimeout(() => setAppNotification(null), 4000);
  };

  const fetchUserProfile = async (authToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Stale or invalid token
        handleLogout();
      }
    } catch (err) {
      console.error("Profile sync error:", err);
    }
  };

  const fetchListings = async () => {
    try {
      const res = await fetch("/api/listings");
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings);
      }
    } catch (err) {
      console.error("Fetch listings error:", err);
      showNotification("Erreur lors de la synchronisation des annonces", "error");
    }
  };

  const handleAuthSuccess = (newToken: string, authedUser: User) => {
    setToken(newToken);
    setUser(authedUser);
    localStorage.setItem("casaloc_token", newToken);
    setShowAuthModal(false);
    showNotification(`Bienvenue, de retour ${authedUser.name} ! Connexion sécurisée SQLite réussie.`, "success");
    
    // Auto-sync listings in case user wants to review their owner listings
    fetchListings();
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("casaloc_token");
    setTab("home");
    showNotification("Vous avez été déconnecté avec succès. À bientôt !", "info");
  };

  const handleOpenAuth = (mode: "login" | "register" | "forgot" = "login") => {
    setInitialAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleListingPublished = (newListing: Listing) => {
    // Append to local listing state
    setListings((prev) => [newListing, ...prev]);
    showNotification("Votre appartement/maison a été publiée avec succès à Bandundu !", "success");
    // Redirect to browse listings tab so the user can inspect the card
    setTab("browse");
  };

  return (
    <div className="min-h-screen bg-slate-55 flex flex-col justify-between" id="casaloc-app-root">
      
      {/* 1. Header Navigation Module */}
      <Header
        currentTab={currentTab}
        setTab={setTab}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => handleOpenAuth("login")}
      />

      {/* 2. Feedback Notification Toast Banners */}
      <AnimatePresence>
        {appNotification && (
          <motion.div
            initial={{ opacity: 0, y: -45, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-18 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
            id="system-notification-banner"
          >
            <div className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 ${
              appNotification.type === "success" 
                ? "bg-emerald-600 border-emerald-500 text-white" 
                : appNotification.type === "error"
                ? "bg-rose-600 border-rose-500 text-white"
                : "bg-slate-900 border-slate-800 text-slate-100"
            }`}>
              <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse text-yellow-300" />
              <p className="text-xs font-bold font-sans leading-relaxed">{appNotification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Primary SPA Main Views Container */}
      <main className="flex-grow w-full py-0">
        <AnimatePresence mode="wait">
          {currentTab === "home" && (
            <motion.div
              key="tab-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Hero
                onPublishClick={() => setTab("publish")}
                onBrowseClick={() => setTab("browse")}
              />
            </motion.div>
          )}

          {currentTab === "browse" && (
            <motion.div
              key="tab-browse"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
            >
              <Listings
                listings={listings}
                onRefresh={fetchListings}
                user={user}
                token={token}
              />
            </motion.div>
          )}

          {currentTab === "publish" && (
            <motion.div
              key="tab-publish"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
            >
              <AddListing
                user={user}
                token={token}
                onSuccess={handleListingPublished}
                onOpenAuth={() => handleOpenAuth("login")}
              />
            </motion.div>
          )}

          {currentTab === "contact" && (
            <motion.div
              key="tab-contact"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
            >
              <Contact />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. Auth modal overlay popup */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              id="auth-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
            />
            {/* Modal Body container */}
            <motion.div
              id="auth-body-container"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative z-10 w-full max-w-md"
            >
              <Auth
                onAuthSuccess={handleAuthSuccess}
                onClose={() => setShowAuthModal(false)}
                initialMode={initialAuthMode}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Clean, Professional Footer block */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800" id="casaloc-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Info & Brand */}
            <div className="space-y-4 col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setTab("home")}>
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold font-display">Cl</div>
                <span className="text-xl font-bold font-display text-white">Casa<span className="text-emerald-400">loc</span></span>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm">
                Casaloc simplifie l'immobilier à Bandundu en République Démocratique du Congo. Nous connectons directement bailleurs et colocataires sans frais d'agence.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold tracking-wide uppercase">
                <span>Base SQLite active</span>
                <span>&bull;</span>
                <span>Node.js Server</span>
              </div>
            </div>

            {/* Column 2: Quick links */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-display">Raccourcis</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li>
                  <button onClick={() => setTab("home")} className="hover:text-emerald-400 transition-colors cursor-pointer">
                    Accueil de l'application
                  </button>
                </li>
                <li>
                  <button onClick={() => setTab("browse")} className="hover:text-emerald-400 transition-colors cursor-pointer">
                    Trouver une maison
                  </button>
                </li>
                <li>
                  <button onClick={() => setTab("publish")} className="hover:text-emerald-400 transition-colors cursor-pointer">
                    Publier une annonce gratuite
                  </button>
                </li>
                <li>
                  <button onClick={() => setTab("contact")} className="hover:text-emerald-400 transition-colors cursor-pointer">
                    Informations et support
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact & Legal (CRITICAL REQUIREMENT) */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-display">Nous Contacter</h4>
              <ul className="space-y-3 text-xs">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <a 
                    href="mailto:gracendwite24@gmail.com" 
                    className="hover:text-emerald-400 transition-colors font-bold text-slate-200"
                    id="footer-email-link"
                  >
                    gracendwite24@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-400 font-medium">Bandundu, RDC</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-slate-500 font-bold tracking-wide uppercase font-sans">
              &copy; {new Date().getFullYear()} Casaloc Bandundu. Tous droits réservés.
            </p>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5" id="designer-credits">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>for Bandundu &bull; Grace Ndwite</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
