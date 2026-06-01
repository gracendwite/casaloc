import React, { useState, useRef } from "react";
import { Upload, MapPin, DollarSign, Image as ImageIcon, AlertCircle, Sparkles, Check, ClipboardCopy, FileText } from "lucide-react";
import { User, Listing } from "../types";

interface AddListingProps {
  user: User | null;
  token: string | null;
  onSuccess: (newListing: Listing) => void;
  onOpenAuth: () => void;
}

const PRESET_IMAGES = [
  {
    id: "preset-1",
    name: "Villa Moderne",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "preset-2",
    name: "Appartement Lumineux",
    url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "preset-3",
    name: "Maison Tropicale",
    url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "preset-4",
    name: "Studio Contemporain",
    url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
  }
];

export default function AddListing({ user, token, onSuccess, onOpenAuth }: AddListingProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  
  // Image states: either a URL from presets or a uploaded base64 string
  const [selectedImage, setSelectedImage] = useState<string>(PRESET_IMAGES[0].url);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("preset-1");
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle files upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) { // 8MB limit
        setError("L'image est trop volumineuse (limite max: 8 MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomImageBase64(base64String);
        setSelectedImage(base64String);
        setSelectedPresetId(""); // Clear presets
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (id: string, url: string) => {
    setSelectedPresetId(id);
    setSelectedImage(url);
    setCustomImageBase64(null); // Clear custom
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;

    setError(null);
    setSuccess(null);

    // Basic Validations
    if (!title.trim() || !description.trim() || !price || !location.trim()) {
      setError("Veuillez remplir tous les champs requis.");
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError("Veuillez entrer un prix mensuel supérieur à zéro.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: numericPrice,
          location: location.trim(),
          image: selectedImage
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur s'est produite.");

      setSuccess("Félicitations ! Votre annonce a été publiée avec succès à Bandundu.");
      
      // Reset inputs after delay
      setTimeout(() => {
        onSuccess(data.listing);
        setTitle("");
        setDescription("");
        setPrice("");
        setLocation("");
        setSelectedPresetId("preset-1");
        setSelectedImage(PRESET_IMAGES[0].url);
        setCustomImageBase64(null);
        setSuccess(null);
      }, 1800);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Guard Clause for unauthenticated users
  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 px-4 text-center" id="listings-auth-guard">
        <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-display mb-3">
            Publier une annonce gratuitement
          </h2>
          <p className="text-slate-500 max-w-md text-sm leading-relaxed mb-8">
            Pour pouvoir publier des biens immobiliers ou contacter d'autres propriétaires à Bandundu, vous devez être connecté. L'inscription est ultra-rapide et gratuite !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              id="btn-guard-login"
              onClick={onOpenAuth}
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-200 hover:-translate-y-0.5 cursor-pointer"
            >
              Créer mon compte / Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-white border border-slate-100 shadow-xl rounded-3xl p-8 md:p-10" id="add-listings-container">
      {/* Form header */}
      <div className="mb-8 pb-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">
            Publier ma maison gratuitement
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium font-sans">
            Créez une visibilité optimale pour votre bien immobilier à Bandundu.
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Créateur</span>
          <span className="text-xs font-bold text-emerald-600">{user.name}</span>
        </div>
      </div>

      {/* API notifications */}
      {error && (
        <div id="add-listing-error-msg" className="mb-6 flex items-start gap-2.5 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 font-semibold text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div id="add-listing-success-msg" className="mb-6 flex items-start gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 font-semibold text-xs">
          <Check className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Add listing Form */}
      <form onSubmit={handleSubmit} className="space-y-6" id="add-listing-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Titre de l'annonce */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Titre de l'annonce *
            </label>
            <input
              id="listing-input-title"
              type="text"
              required
              maxLength={70}
              placeholder="Ex. Jolie maison indépendante de 3 chambres à Lumumba"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder-slate-400"
            />
          </div>

          {/* Prix mensuel */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Prix Mensuel ($ USD) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                id="listing-input-price"
                type="number"
                required
                min={1}
                placeholder="Ex. 250"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder-slate-400"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Fixez un montant de loyer mensuel réaliste.</p>
          </div>

          {/* Localisation */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Localisation / Quartier *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                id="listing-input-location"
                type="text"
                required
                placeholder="Ex. Quarter Malebo, Bandundu Centre"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder-slate-400"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Indiquez le quartier et l'avenue ou point de repère.</p>
          </div>

          {/* Description */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Description complète de la maison *
            </label>
            <textarea
              id="listing-input-description"
              required
              rows={4}
              maxLength={800}
              placeholder="Décrivez les atouts de votre maison : nombre de chambres, douches, stabilité d'électricité, réservoir d'eau, raccordement, proximité, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder-slate-400 resize-none"
            />
          </div>

          {/* Image Upload / Stock Selector */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Image représentative de la maison *
            </label>

            {/* Selection Options Tabs */}
            <div className="mb-4">
              <p className="text-xs text-slate-400 font-semibold mb-2.5">
                Étape 1 : Choisissez l'une de nos superbes photos d'illustration ou importez votre propre image
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_IMAGES.map((preset) => (
                  <button
                    id={`btn-preset-${preset.id}`}
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id, preset.url)}
                    className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all text-left cursor-pointer ${
                      selectedPresetId === preset.id
                        ? "border-emerald-600 ring-2 ring-emerald-500/10 scale-[1.02]"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/35 flex items-end p-2">
                      <span className="text-[10px] font-bold text-white line-clamp-1">{preset.name}</span>
                    </div>
                    {selectedPresetId === preset.id && (
                      <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom file Dropzone */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch mt-4 border-t border-dashed border-slate-200 pt-4">
              <div className="flex-1">
                <input
                  id="listing-file-uploader"
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <button
                  id="btn-file-trigger"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-all cursor-pointer ${
                    customImageBase64 
                      ? "border-emerald-600 bg-emerald-50/20 text-emerald-700"
                      : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50 text-slate-500"
                  }`}
                >
                  <Upload className="w-6 h-6 mb-1.5 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700 mb-0.5">
                    {customImageBase64 ? "Image personnalisée chargée" : "Importer une photo de l'appareil"}
                  </span>
                  <span className="text-[10px] text-slate-400">Fichier PNG, JPG jusqu'à 8 MB</span>
                </button>
              </div>

              {/* Current Selection Preview */}
              <div className="w-full sm:w-44 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center aspect-video sm:aspect-auto">
                {selectedImage ? (
                  <div className="relative w-full h-full flex flex-col justify-end p-2 min-h-24">
                    <img
                      src={selectedImage}
                      alt="Aperçu avant publication"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />
                    <span className="relative text-[9px] text-white font-bold uppercase tracking-wider backdrop-blur-xs px-1.5 py-0.5 rounded-md bg-black/20 self-start">
                      Aperçu de la photo
                    </span>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-5 h-5 mx-auto text-slate-300 mb-1" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Aucun aperçu</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit action buttons */}
        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-4 justify-end">
          <button
            id="btn-listing-submit"
            type="submit"
            disabled={loading}
            className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Publier l'annonce gratuitement"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
