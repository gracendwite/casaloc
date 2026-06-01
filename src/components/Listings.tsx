import React, { useState, useEffect } from "react";
import { Search, MapPin, DollarSign, User as UserIcon, Calendar, ClipboardCheck, ClipboardCopy, X, Sparkles, MessageCircle, AlertCircle } from "lucide-react";
import { Listing, User } from "../types";

interface ListingsProps {
  listings: Listing[];
  onRefresh: () => void;
  user: User | null;
  token: string | null;
}

export default function Listings({ listings, onRefresh, user, token }: ListingsProps) {
  // Query Filter States
  const [locFilter, setLocFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [filteredListings, setFilteredListings] = useState<Listing[]>(listings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected Listing Detail Modal State
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatSuccess, setChatSuccess] = useState<string | null>(null);

  // Initialize and respond when parent listing updates
  useEffect(() => {
    setFilteredListings(listings);
  }, [listings]);

  // Execute database search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (locFilter.trim() !== "") {
        queryParams.append("loc", locFilter.trim());
      }
      if (priceFilter.trim() !== "") {
        queryParams.append("maxPrice", priceFilter.trim());
      }

      const res = await fetch(`/api/listings?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Erreur de communication avec la base de données SQLite");

      const data = await res.json();
      setFilteredListings(data.listings);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setLocFilter("");
    setPriceFilter("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/listings");
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setFilteredListings(data.listings);
    } catch (err: any) {
      setError("Erreur lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLandlordEmail = (email: string) => {
    // Standard copy simulation
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSendChatMock = (e: React.FormEvent, landlordName: string) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setChatSuccess(`Votre message a été transmis avec succès à ${landlordName} !`);
    setChatMessage("");
    setTimeout(() => setChatSuccess(null), 4000);
  };

  const handleDeleteListing = async (listingId: number) => {
    if (!token || !confirm("Êtes-vous sûr de vouloir supprimer cette annonce définitivement de Casaloc ?")) return;

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Close modal and refresh listings
      setSelectedListing(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Impossible de supprimer l'annonce");
    }
  };

  return (
    <div className="w-full flex flex-col gap-10" id="listings-browser">
      {/* Search Header Container */}
      <section className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden" id="listings-header-section">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight font-display text-white">
            Trouver la maison idéale à Bandundu
          </h2>
          <p className="mt-2 text-slate-300 text-sm font-sans font-medium">
            Explorez notre vaste sélection de maisons, villas, appartements et bureaux vérifiés, directement mis en location par les habitants locaux de Bandundu.
          </p>

          {/* Search Inputs Form */}
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-8 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10" id="listings-search-form">
            <div className="sm:col-span-5 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400" />
              </div>
              <input
                id="search-input-loc"
                type="text"
                placeholder="Localisation (Ex. Malebo, Basoko...)"
                value={locFilter}
                onChange={(e) => setLocFilter(e.target.value)}
                className="block w-full pl-9 pr-3 py-3 rounded-xl bg-white/10 border border-white/5 text-slate-100 placeholder-slate-300 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:bg-white focus:text-slate-900 transition-all"
              />
            </div>

            <div className="sm:col-span-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-300">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <input
                id="search-input-price"
                type="number"
                placeholder="Prix maximum ($)"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="block w-full pl-9 pr-3 py-3 rounded-xl bg-white/10 border border-white/5 text-slate-100 placeholder-slate-300 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:bg-white focus:text-slate-900 transition-all"
              />
            </div>

            <div className="sm:col-span-3 flex gap-2">
              <button
                id="btn-search-submit"
                type="submit"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-emerald-950/20"
              >
                <Search className="w-4 h-4" />
                <span>Rechercher</span>
              </button>
              {(locFilter || priceFilter) && (
                <button
                  id="btn-search-clear"
                  type="button"
                  onClick={handleClearFilters}
                  className="bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 h-11 w-11 rounded-xl flex items-center justify-center transition-colors cursor-pointer border border-slate-700/60"
                  title="Réinitialiser les filtres"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Grid List View */}
      <section id="listings-grid-view">
        {loading ? (
          <div className="py-20 text-center" id="listings-loading">
            <span className="inline-block w-8 h-8 border-4 border-emerald-500/35 border-t-emerald-600 rounded-full animate-spin" />
            <p className="mt-4 text-sm text-slate-400 font-bold font-sans">Chargement des annonces de la base de données SQLite...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center bg-red-50/50 rounded-2xl border border-red-100 max-w-lg mx-auto" id="listings-error">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="mt-3 font-bold text-slate-800">Erreur lors de la recherche</h4>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 rounded-3xl border border-slate-100 max-w-xl mx-auto px-6" id="listings-empty">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 font-display">Aucune annonce trouvée</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Nous n'avons trouvé aucun bien correspondant à vos critères à Bandundu. Essayez d'ajuster vos filtres de localisation ou d'élargir votre marge tarifaire.
            </p>
            <button
              id="btn-empty-reset"
              onClick={handleClearFilters}
              className="mt-6 px-5 py-2.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Afficher toutes les annonces
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 font-display flex items-center gap-1.5 pl-1.5 border-l-4 border-emerald-500">
                Annonces disponibles
                <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full ml-1 font-sans">
                  {filteredListings.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">Basse-cour SQLite &bull; Bandundu</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" id="listings-grid">
              {filteredListings.map((listing) => (
                <article
                  id={`listing-card-${listing.id}`}
                  key={listing.id}
                  onClick={() => {
                    setSelectedListing(listing);
                    // Reset copy/chat actions
                    setCopiedEmail(false);
                    setChatMessage("");
                    setChatSuccess(null);
                  }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer flex flex-col group"
                >
                  {/* Photo area */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img
                      src={listing.image}
                      alt={listing.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center shadow-md">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-sans font-extrabold">{listing.price}</span>
                      <span className="text-[10px] text-slate-300 font-semibold ml-0.5">/ mois</span>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-emerald-600/90 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                      <MapPin className="w-3 h-3 text-emerald-300" />
                      <span className="line-clamp-1">{listing.location.split(",")[0]}</span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-800 line-clamp-1 font-display group-hover:text-emerald-700 transition-colors">
                        {listing.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                        {listing.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-55 flex items-center justify-between text-slate-400">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200">
                          <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="line-clamp-1">{listing.userName}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(listing.createdAt).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Lightbox / Details Modal */}
      {selectedListing && (
        <div id="listing-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col md:flex-row relative">
            
            {/* Close trigger button */}
            <button
              id="btn-modal-close"
              onClick={() => setSelectedListing(null)}
              className="absolute top-4 right-4 z-10 p-2.5 bg-slate-900/65 hover:bg-slate-950 text-white rounded-full transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Image Column */}
            <div className="md:w-1/2 bg-slate-100 relative min-h-[220px] md:min-h-0">
              <img
                src={selectedListing.image}
                alt={selectedListing.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none md:hidden" />
              <div className="absolute bottom-4 left-4 md:hidden text-white">
                <span className="text-xs bg-emerald-600 text-white font-extrabold px-2.5 py-1 rounded-lg">
                  {selectedListing.price} $ / mois
                </span>
                <h4 className="text-lg font-bold font-display mt-2 shadow-xs">{selectedListing.title}</h4>
              </div>
            </div>

            {/* Right Information Details Column */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col justify-between max-h-[90vh] md:max-h-[80vh]">
              <div>
                {/* Meta details */}
                <div className="hidden md:flex items-center gap-2 mb-3">
                  <span className="text-xl font-black text-slate-800 font-display">
                    {selectedListing.price} $
                    <span className="text-xs text-slate-400 font-medium font-sans"> / mois</span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 font-extrabold px-2 rounded-md py-0.5 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    {selectedListing.location.split(",")[0]}
                  </span>
                </div>

                <h3 className="hidden md:block text-xl font-bold text-slate-800 font-display leading-snug">
                  {selectedListing.title}
                </h3>

                {/* Localisation detail */}
                <p className="mt-3 text-slate-500 text-xs font-semibold flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Adresse : {selectedListing.location}
                </p>

                {/* Description content */}
                <div className="mt-5 text-sm text-slate-600 leading-relaxed font-normal">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">Description du bien :</h4>
                  <p className="whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200">
                    {selectedListing.description}
                  </p>
                </div>

                {/* Owner section */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2.5">Bailleur propriétaire :</h4>
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                        {selectedListing.userName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-800 block leading-tight">{selectedListing.userName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Bailleur vérifié &bull; Bandundu</span>
                      </div>
                    </div>
                    {/* Copy mail simulated contact */}
                    <button
                      id="btn-landlord-copy-email"
                      type="button"
                      onClick={() => handleCopyLandlordEmail("gracendwite24@gmail.com")}
                      className={`text-xs px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        copiedEmail
                          ? "bg-slate-200 text-slate-700"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {copiedEmail ? (
                        <>
                          <ClipboardCheck className="w-4 h-4" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="w-4 h-4" />
                          gracendwite24@gmail.com
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Messaging simulated interaction */}
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2.5 flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  Laisser un message de visite :
                </h4>
                
                {chatSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
                    {chatSuccess}
                  </div>
                )}

                <form onSubmit={(e) => handleSendChatMock(e, selectedListing.userName)} className="flex gap-2">
                  <input
                    id="modal-chat-input"
                    type="text"
                    required
                    maxLength={300}
                    placeholder="Ex. Bonjour, je souhaite visiter cette maison ce samedi..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 bg-slate-50 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
                  />
                  <button
                    id="btn-modal-chat-submit"
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Envoyer
                  </button>
                </form>
              </div>

              {/* Admin delete triggers for owners */}
              {user && user.id === selectedListing.userId && (
                <div className="mt-6 pt-4 border-t border-red-15 flex justify-end">
                  <button
                    id="btn-modal-delete-listing"
                    onClick={() => handleDeleteListing(selectedListing.id)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Supprimer mon annonce
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
