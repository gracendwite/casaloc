import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { UploadCloud, MessageSquare, Home, Shield, Zap, MapPin, ArrowRight } from "lucide-react";
import heroBg from "../assets/images/bandundu_house_bg_1780309359949.png";

interface HeroProps {
  onPublishClick: () => void;
  onBrowseClick: () => void;
}

export default function Hero({ onPublishClick, onBrowseClick }: HeroProps) {
  // Parallax mouse variables
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 1024, height: 768 });

  useEffect(() => {
    // Handle resizes
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    // Calculate distance from center of the header/hero screen
    const centerX = windowSize.width / 2;
    const centerY = windowSize.height / 3;
    const x = (e.clientX - centerX) / centerX; // Range -1 to 1
    const y = (e.clientY - centerY) / centerY; // Range -1 to 1
    setCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setCoords({ x: 0, y: 0 });
  };

  // Parallax transform styles (offset maximum 24px)
  const bgTransform = {
    transform: `scale(1.08) translate(${coords.x * -24}px, ${coords.y * -24}px)`,
    transition: "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)"
  };

  const overlayTransform = {
    transform: `translate(${coords.x * 8}px, ${coords.y * 8}px)`,
    transition: "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)"
  };

  return (
    <div className="w-full flex flex-col" id="casaloc-hero-page">
      {/* 1. HERO BANNER WITH ANIMATED PARALLAX */}
      <section 
        id="interactive-hero-banner"
        className="relative w-full h-[580px] overflow-hidden bg-slate-900 flex items-center justify-center cursor-default"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Parallax Background Image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center select-none opacity-45 pointer-events-none"
          style={{ 
            backgroundImage: `url(${heroBg})`,
            ...bgTransform 
          }}
          id="parallax-bg-wrapper"
        />

        {/* Ambient Overlay Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/65 pointer-events-none" />

        {/* Dynamic content card styled to balance space */}
        <div 
          className="relative max-w-4xl mx-auto px-4 text-center z-10 flex flex-col items-center"
          style={overlayTransform}
          id="hero-content-animator"
        >
          {/* Tagline Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wider uppercase mb-6"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Leader Immobilier à Bandundu</span>
          </motion.div>

          {/* Slogan */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-3xl font-display"
          >
            Publiez ou trouvez une maison à <span className="text-emerald-400 underline decoration-emerald-500 decoration-wavy underline-offset-8">Bandundu</span> facilement
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 text-lg sm:text-xl text-slate-300 max-w-xl font-normal leading-relaxed font-sans"
          >
            Rejoignez la plus grande communauté de location de maisons en RDC. Zéro frais de commission, contact direct avec les propriétaires locaux.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            id="hero-ctas"
          >
            <button
              id="btn-hero-publish"
              onClick={onPublishClick}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              Publier ma maison gratuitement
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="btn-hero-browse"
              onClick={onBrowseClick}
              className="px-8 py-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-100 font-bold text-base rounded-2xl backdrop-blur-xs transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              Explorer les annonces
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. SECTION "COMMENT ÇA MARCHE" */}
      <section className="py-20 bg-slate-50 border-b border-slate-100" id="how-it-works-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
              Comment ça marche ?
            </h2>
            <p className="mt-4 text-slate-500 text-sm font-medium">
              Une méthode simplifiée pour vous louer et publier à Bandundu en toute sérénité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative" id="steps-container">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all relative flex flex-col items-center text-center group" id="step-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <span className="absolute top-4 right-6 text-5xl font-black text-slate-100 font-display select-none">01</span>
              <h3 className="text-lg font-bold text-slate-800 font-display">📤 Publier une annonce</h3>
              <p className="mt-3 text-sm text-slate-500 font-normal leading-relaxed">
                Remplissez notre formulaire en 2 minutes avec des photos de votre maison, fixez votre prix de loyer et localisez l'annonce.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all relative flex flex-col items-center text-center group" id="step-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-7 h-7" />
              </div>
              <span className="absolute top-4 right-6 text-5xl font-black text-slate-100 font-display select-none">02</span>
              <h3 className="text-lg font-bold text-slate-800 font-display">💬 Contacter un propriétaire</h3>
              <p className="mt-3 text-sm text-slate-500 font-normal leading-relaxed">
                Trouvez la maison idéale à l'aide de notre moteur de recherche, puis contactez directement le propriétaire par email ou numéro affiché.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all relative flex flex-col items-center text-center group" id="step-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                <Home className="w-7 h-7" />
              </div>
              <span className="absolute top-4 right-6 text-5xl font-black text-slate-100 font-display select-none">03</span>
              <h3 className="text-lg font-bold text-slate-800 font-display">🏠 Louer</h3>
              <p className="mt-3 text-sm text-slate-500 font-normal leading-relaxed">
                Organisez des visites directes des lieux sans aucun intermédiaire, signez votre bail et emménagez dans votre nouvelle maison.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION "POURQUOI CHOISIR CASALOC" */}
      <section className="py-20 bg-white" id="why-choose-us-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
              Pourquoi choisir Casaloc ?
            </h2>
            <p className="mt-4 text-slate-500 text-sm font-medium">
              Notre plateforme répond spécifiquement aux besoins des habitants et bailleurs de Bandundu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10" id="benefits-container">
            {/* Benefit 1 */}
            <div className="flex gap-4 items-start" id="benefit-security">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl flex-shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  🔒 Sécurité et Transparence
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed font-normal">
                  Chaque compte utilisateur et annonce est vérifié par nos équipes pour limiter les abus. Le contact direct évite les arnaques d'agents fictifs.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex gap-4 items-start" id="benefit-speed">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl flex-shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  ⚡ Grande Rapidité
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed font-normal">
                  Publiez en quelques clics ou filtrez instantanément par prix et par quartier à Bandundu pour trouver le loyer adapté à votre budget.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex gap-4 items-start" id="benefit-local">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  🌍 Local et Proche
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed font-normal">
                  Une plateforme pensée pour les quartiers de Bandundu : Lumumba, Malebo, Basoko, etc. Vous savez exactement où se situent les maisons.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
