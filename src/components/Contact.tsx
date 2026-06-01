import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Sparkles, MessageSquare } from "lucide-react";

export default function Contact() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userName.trim() || !userEmail.trim() || !messageSubject.trim() || !messageBody.trim()) {
      setError("Veuillez remplir tous les champs requis.");
      return;
    }

    setLoading(true);

    // Simulate server transport delay
    setTimeout(() => {
      setLoading(false);
      setSuccess("Merci ! Votre message a été reçu avec succès par notre support Casaloc. Nous vous répondrons par e-mail dans les plus brefs délais.");
      
      // Clear
      setUserName("");
      setUserEmail("");
      setMessageSubject("");
      setMessageBody("");
    }, 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-12" id="contact-page-container">
      {/* Introdutory Section Banner */}
      <section className="text-center max-w-2xl mx-auto" id="contact-intro">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
          Contactez-nous
        </h2>
        <p className="mt-3 text-sm text-slate-500 font-medium font-sans leading-relaxed">
          Une suggestion, un partenariat ou un problème d’utilisation de Casaloc ? Nos équipes locales à Bandundu vous répondent avec enthousiasme.
        </p>
      </section>

      {/* Two Columns Grid: Details vs Form */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch" id="contact-panels">
        {/* Left Column: Coordinates */}
        <div className="md:col-span-5 bg-slate-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden" id="contact-info-panel">
          <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <span className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider">
              Assistance Casaloc
            </span>
            <h3 className="text-2xl font-bold tracking-tight font-display mt-2">
              Informations de contact
            </h3>
            <p className="mt-3 text-xs text-slate-300 font-medium leading-relaxed">
              Pour toute réclamation urgente ou demande d'assistance directe, n'hésitez pas à nous écrire directement ou à visiter nos bureaux de test.
            </p>

            {/* List coordinates */}
            <div className="space-y-6 mt-10">
              {/* E-mail (CRITICAL REQUIREMENT) */}
              <div className="flex gap-4 items-start" id="coord-email">
                <div className="p-3 bg-white/10 rounded-xl text-emerald-400 flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Notre E-mail</span>
                  <a 
                    href="mailto:gracendwite24@gmail.com" 
                    id="link-gracendwite-email"
                    className="text-sm font-semibold text-white hover:text-emerald-300 transition-colors pointer-default"
                  >
                    gracendwite24@gmail.com
                  </a>
                </div>
              </div>

              {/* Phone contact */}
              <div className="flex gap-4 items-start" id="coord-phone">
                <div className="p-3 bg-white/10 rounded-xl text-emerald-400 flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Téléphone RDC</span>
                  <span className="text-sm font-semibold text-white">+243 813 298 342</span>
                </div>
              </div>

              {/* Physical presence location */}
              <div className="flex gap-4 items-start" id="coord-address">
                <div className="p-3 bg-white/10 rounded-xl text-emerald-400 flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Siège Administratif</span>
                  <span className="text-sm font-semibold text-white">Avenue du Fleuve, Bandundu RDC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Slogan footnote */}
          <div className="mt-12 pt-6 border-t border-white/10 text-xs text-slate-400 font-medium relative z-10 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Casaloc : Simplifier l'immobilier à Bandundu.</span>
          </div>
        </div>

        {/* Right Column: Inquiry Form */}
        <div className="md:col-span-7 bg-white border border-slate-100 p-8 sm:p-10 rounded-3xl shadow-sm" id="contact-form-panel">
          <h3 className="text-xl font-bold text-slate-800 font-display mb-6">
            Envoyer un message de support
          </h3>

          {error && (
            <div id="contact-error-banner" className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 font-semibold text-xs animate-fade-in">
              <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div id="contact-success-banner" className="mb-5 flex items-start gap-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 font-semibold text-xs animate-fade-in">
              <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" id="contact-inquiry-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Votre nom complec
                </label>
                <input
                  id="contact-input-name"
                  type="text"
                  required
                  placeholder="Ex. Grace Ndwite"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-55 focus:border-emerald-500 placeholder-slate-400 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Votre adresse e-mail
                </label>
                <input
                  id="contact-input-email"
                  type="email"
                  required
                  placeholder="nom@exemple.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-55 focus:border-emerald-500 placeholder-slate-400 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Sujet du message
              </label>
              <input
                id="contact-input-subject"
                type="text"
                required
                placeholder="Ex. Question sur la publication, Problème technique..."
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-55 focus:border-emerald-500 placeholder-slate-400 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Détail de votre message
              </label>
              <textarea
                id="contact-input-body"
                required
                rows={5}
                placeholder="Expliquez en détail votre demande pour que notre support vous aide rapidement..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-55 focus:border-emerald-500 placeholder-slate-400 font-sans resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="btn-contact-submit"
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-35 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Envoyer mon message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
