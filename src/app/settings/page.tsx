"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { 
  User, 
  Globe, 
  MessageSquare, 
  Briefcase, 
  Save, 
  Star, 
  Plus, 
  Share2, 
  Link as LinkIcon, 
  Loader2, 
  CheckCircle2, 
  Trash2, 
  X,
  Zap,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Facebook,
  MessageCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Shield,
  ImageIcon,
  FileText,
  Video,
  MapPin,
  Upload,
  Eye,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { QRCodeCanvas } from "qrcode.react";

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  x: Twitter,
  youtube: Youtube,
  facebook: Facebook,
  whatsapp: MessageCircle,
};

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  
  const [activeTab, setActiveTab] = useState(tabParam || "brand");

  // Sync state with URL parameter if it changes via navigation
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };
  
  // Brand Form State
  const [brandName, setBrandName] = useState("Contentsathi Demo");
  const [industry, setIndustry] = useState("Real Estate & Land Development");
  const [brandDesc, setBrandDesc] = useState("We are a premium land developer based in Nagpur focusing on high-appreciation residential plots near upcoming infrastructure.");
  const [audience, setAudience] = useState("Investors, first-time buyers, IT professionals looking for second homes.");
  const [tone, setTone] = useState("Professional but approachable");
  const [primaryLang, setPrimaryLang] = useState("English");
  const [secondaryLang, setSecondaryLang] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "linkedin", "whatsapp", "youtube"]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [transliterateRoman, setTransliterateRoman] = useState(false);

  // Profile
  const [profileName, setProfileName] = useState("");
  const [profileCurrentPassword, setProfileCurrentPassword] = useState("");
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // States for Social Accounts & Websites
  const [accounts, setAccounts] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingWebsites, setIsLoadingWebsites] = useState(false);
  
  // New Website form state
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [newSiteWebhook, setNewSiteWebhook] = useState("");
  const [isAddingSite, setIsAddingSite] = useState(false);

  // WhatsApp manual entry state
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
  const [waAccessToken, setWaAccessToken] = useState("");
  const [waBusinessId, setWaBusinessId] = useState("");
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    // Handle OAuth callback parameters
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const success = params.get("success");
      const error = params.get("error");
      
      if (success) {
        toast.success(`Successfully connected ${success.charAt(0).toUpperCase() + success.slice(1)}! 🚀`);
        window.history.replaceState({}, document.title, window.location.pathname + "?tab=accounts");
      }
      
      if (error) {
        const errorMessages: Record<string, string> = {
          oauth_denied: "Permission was denied. Please try again.",
          token_failed: "Failed to exchange tokens with the platform.",
          user_not_found: "Session error. Please login again.",
          encryption_failed: "Security error while saving tokens.",
          invalid_state: "Security verification failed. Please try again.",
          session_expired: "Session expired. Please try connecting again."
        };
        toast.error(errorMessages[error] || "An error occurred during connection.");
        window.history.replaceState({}, document.title, window.location.pathname + "?tab=accounts");
      }
    }

    loadBrainData();
    // Load user profile and transliteration preference W4
    fetch("/api/user/profile")
      .then(r => r.json())
      .then(u => { 
        if (u.id) setUserId(u.id);
        if (u.name) setProfileName(u.name); 
        if (u.platformLangPrefs?.transliterateRoman) setTransliterateRoman(true);
      })
      .catch(() => {});
  }, []);

  const loadBrainData = async () => {
    try {
      const res = await fetch("/api/content-brain");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setBrandName(data.brandName || "");
          setIndustry(data.niche || "");
          setBrandDesc(data.brandDescription || "");
          setAudience(data.audienceDescription || "");
          setTone(data.tone || "Professional but approachable");
          setPrimaryLang(data.primaryLanguage || "English");
          setSecondaryLang(data.secondaryLanguage || "");
          if (data.platforms) {
            setSelectedPlatforms(JSON.parse(data.platforms));
          }
        }
      }
    } catch (e) {
      console.error("Error loading brain data:", e);
    }
  };

  const handleSaveBrand = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/content-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          brandDescription: brandDesc,
          niche: industry,
          audienceDescription: audience,
          tone,
          primaryLanguage: primaryLang,
          secondaryLanguage: secondaryLang,
          platforms: selectedPlatforms
        })
      });
      if (res.ok) {
        // Also save transliteration setting W4
        await fetch("/api/user/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platformLangPrefs: { transliterateRoman } })
        });
        
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Error saving brain data:", e);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === "accounts") fetchAccounts();
    if (activeTab === "websites") fetchWebsites();
  }, [activeTab]);

  const fetchAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const res = await fetch("/api/social-accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const fetchWebsites = async () => {
    setIsLoadingWebsites(true);
    try {
      const res = await fetch("/api/website-connections");
      const data = await res.json();
      setWebsites(data.websites || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingWebsites(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;
    try {
      await fetch(`/api/social-accounts?id=${id}`, { method: "DELETE" });
      fetchAccounts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const body: any = { name: profileName };
      if (profileNewPassword) {
        body.currentPassword = profileCurrentPassword;
        body.newPassword = profileNewPassword;
      }
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfileSuccess("Profile updated successfully!");
      setProfileCurrentPassword("");
      setProfileNewPassword("");
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName || !newSiteUrl || !newSiteWebhook) return;
    setIsAddingSite(true);
    try {
      const res = await fetch("/api/website-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSiteName, siteUrl: newSiteUrl, webhookUrl: newSiteWebhook })
      });
      if (res.ok) {
        setNewSiteName("");
        setNewSiteUrl("");
        setNewSiteWebhook("");
        toast.success("Website block added! 🌐");
        fetchWebsites();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to add website");
      }
    } catch (err: any) {
      toast.error(err.message || "Error adding website");
    } finally {
      setIsAddingSite(false);
    }
  };

  const handleConnectWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhoneNumberId || !waAccessToken) return;
    setIsConnectingWhatsApp(true);
    try {
      const res = await fetch("/api/auth/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumberId: waPhoneNumberId, 
          accessToken: waAccessToken,
          businessAccountId: waBusinessId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect WhatsApp");
      
      toast.success(`WhatsApp connected as ${data.displayName}! ✅`);
      setWaPhoneNumberId("");
      waAccessToken && setWaAccessToken("");
      setWaBusinessId("");
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.message || "WhatsApp connection failed");
    } finally {
      setIsConnectingWhatsApp(false);
    }
  };

  const handleDeleteWebsite = async (id: string) => {
    if (!confirm("Are you sure you want to remove this website block?")) return;
    try {
      await fetch(`/api/website-connections/${id}`, { method: "DELETE" });
      fetchWebsites();
    } catch (e) {
      console.error(e);
    }
  };

  // Helper config for platforms
  const PLATFORMS = [
    { id: "instagram", name: "Instagram", color: "text-pink-600", bg: "bg-pink-50" },
    { id: "linkedin", name: "LinkedIn", color: "text-blue-600", bg: "bg-blue-50" },
    { id: "youtube", name: "YouTube", color: "text-red-600", bg: "bg-red-50" },
    { id: "x", name: "X (Twitter)", color: "text-zinc-800", bg: "bg-zinc-100" },
    { id: "facebook", name: "Facebook Page", color: "text-blue-700", bg: "bg-blue-50" }
  ];



  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settings &amp; Integrations</h1>
        <p className="text-gray-500 mt-1">Configure your <strong>ContentSathi AI</strong> team — brand profile, channels, language preferences and workspace integrations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            <button 
              onClick={() => handleTabChange("brand")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "brand" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Briefcase className="w-5 h-5" /> Brand & Niche
            </button>
            <button 
              onClick={() => handleTabChange("languages")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "languages" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Globe className="w-5 h-5" /> Languages & Tone
            </button>
            <button 
              onClick={() => handleTabChange("accounts")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "accounts" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Share2 className="w-5 h-5" /> Connected Accounts
            </button>
            <button 
              onClick={() => handleTabChange("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "profile" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <User className="w-5 h-5" /> Profile
            </button>
            <button 
              onClick={() => handleTabChange("websites")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "websites" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <LinkIcon className="w-5 h-5" /> Website Blocks
            </button>
            <button 
              onClick={() => handleTabChange("examples")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "examples" ? "bg-amber-50 text-amber-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Star className="w-5 h-5 text-amber-500" /> Golden Examples
            </button>
            <button 
              onClick={() => handleTabChange("notifications")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "notifications" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <AlertCircle className="w-5 h-5" /> Notifications
            </button>
            <button 
              onClick={() => handleTabChange("billing")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "billing" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Zap className="w-5 h-5" /> Plan &amp; Billing
            </button>
            <button 
              onClick={() => handleTabChange("ai-engine")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "ai-engine" ? "bg-violet-50 text-violet-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <TrendingUp className="w-5 h-5 text-violet-500" /> AI Engine
            </button>
            <button 
              onClick={() => handleTabChange("project-media")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "project-media" ? "bg-emerald-50 text-emerald-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ImageIcon className="w-5 h-5 text-emerald-500" /> Project Media
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
          
          {activeTab === "brand" && (
            <div className="p-8 animate-in fade-in slide-in-from-right-2">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Brand & Niche</h2>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                    <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Description</label>
                  <textarea rows={3} value={brandDesc} onChange={e => setBrandDesc(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none resize-y"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Customer (Audience)</label>
                  <textarea rows={2} value={audience} onChange={e => setAudience(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none resize-y"></textarea>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                {saveSuccess && (
                  <p className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Saved Successfully!
                  </p>
                )}
                <div className="flex-1" />
                <button 
                  onClick={handleSaveBrand}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md disabled:opacity-50 transition-all"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "languages" && (
            <div className="p-8 animate-in fade-in slide-in-from-right-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Languages & Tone</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Generation Tone</label>
                  <select 
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    className="w-full md:w-1/2 px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                  >
                    <option>Professional but approachable</option>
                    <option>Authoritative & Data-driven</option>
                    <option>Casual, Friendly, Emoji-heavy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Target Platforms</label>
                  <div className="flex flex-wrap gap-3">
                    {PLATFORMS.map(p => (
                      <label key={p.id} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedPlatforms.includes(p.id) ? "border-indigo-600 bg-indigo-50 shadow-sm" : "border-gray-200 hover:bg-gray-50"
                      }`}>
                        <input 
                          type="checkbox" 
                          checked={selectedPlatforms.includes(p.id)}
                          onChange={() => {
                            if (selectedPlatforms.includes(p.id)) {
                              setSelectedPlatforms(selectedPlatforms.filter(x => x !== p.id));
                            } else {
                              setSelectedPlatforms([...selectedPlatforms, p.id]);
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300" 
                        />
                        <span className={`text-sm font-bold ${selectedPlatforms.includes(p.id) ? "text-indigo-700" : "text-gray-600"}`}>{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Languages</label>
                  <div className="flex flex-wrap gap-3">
                    {["English", "Hindi", "Marathi", "Hinglish"].map(l => (
                      <label key={l} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                        primaryLang === l || secondaryLang === l ? "border-indigo-600 bg-indigo-50 shadow-sm" : "border-gray-200 hover:bg-gray-50"
                      }`}>
                        <input 
                          type="checkbox" 
                          checked={primaryLang === l || secondaryLang === l}
                          onChange={() => {
                            if (primaryLang === l) {
                              setPrimaryLang("English");
                            } else if (secondaryLang === l) {
                              setSecondaryLang("");
                            } else {
                              if (!primaryLang || primaryLang === "English") setPrimaryLang(l);
                              else setSecondaryLang(l);
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300" 
                        />
                        <span className={`text-sm font-bold ${primaryLang === l || secondaryLang === l ? "text-indigo-700" : "text-gray-600"}`}>{l}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Transliterate Roman to Devanagari</p>
                      <p className="text-xs text-gray-500 font-medium">Automatically rewrite Hindi/Marathi text written in English script (e.g. &quot;kase aahat&quot;) into proper Devanagari script (&quot;कसे आहात&quot;).</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={transliterateRoman} 
                        onChange={(e) => setTransliterateRoman(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                {saveSuccess && (
                  <p className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Preferences Saved!
                  </p>
                )}
                <div className="flex-1" />
                <button 
                  onClick={handleSaveBrand}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md disabled:opacity-50 transition-all"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "accounts" && (
            <div className="p-8 animate-in fade-in slide-in-from-right-2">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Social Integrations</h2>
                    <p className="text-sm text-gray-500 font-medium">Connect your platforms for seamless 1-click publishing.</p>
                  </div>
                </div>
              </div>
              
              {isLoadingAccounts ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-sm font-bold text-gray-400">Syncing your connections...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    {PLATFORMS.map(platform => {
                      const connected = (accounts || []).find(a => a.platform.toLowerCase() === platform.id);
                      const Icon = PLATFORM_ICONS[platform.id] || Share2;
                      
                      return (
                        <div key={platform.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-500">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${platform.bg} ${platform.color} transition-transform group-hover:scale-110 duration-500`}>
                              <Icon className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="text-lg font-black text-gray-900 tracking-tight">{platform.name}</p>
                              {connected ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Active
                                    </div>
                                    <span className="text-xs font-bold text-gray-400">as {connected.accountName || "Account"}</span>
                                </div>
                              ) : (
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mt-1">Not Integrated</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 sm:mt-0">
                            {connected ? (
                              <button 
                                onClick={() => handleDisconnect(connected.id)}
                                className="px-6 py-2.5 text-sm font-black text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition-all border border-red-100 hover:border-red-500 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Disconnect
                              </button>
                            ) : (
                              <a 
                                href={`/api/auth/${platform.id}/connect`}
                                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-100"
                              >
                                <Plus className="w-4 h-4" />
                                Connect Now
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* WhatsApp Manual Entry block */}
                  <div className="overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-[2.5rem] p-8 mt-10 relative">
                    <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12">
                        <MessageCircle className="w-40 h-40 text-green-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-green-600 text-white rounded-2xl shadow-lg">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                                <div>
                                    <h3 className="text-xl font-black text-green-900 tracking-tight">WhatsApp Business API</h3>
                                    <p className="text-sm font-medium text-green-700">Enter credentials or connect via QR code for easier setup.</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setShowQRModal(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-white text-green-600 border-2 border-green-200 rounded-2xl font-black text-sm hover:bg-green-100 hover:border-green-300 transition-all shadow-sm"
                                >
                                    <Zap className="w-4 h-4 fill-green-600" />
                                    Connect via QR
                                </button>
                            </div>
                        </div>
                        
                        <form onSubmit={handleConnectWhatsApp} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          <div className="space-y-2">
                             <label className="block text-xs font-black text-green-800 uppercase tracking-widest ml-1">Phone Number ID</label>
                             <input 
                               value={waPhoneNumberId}
                               onChange={e => setWaPhoneNumberId(e.target.value)}
                               type="text" 
                               className="w-full px-5 py-3 border border-green-200 rounded-2xl text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" 
                               placeholder="e.g. 10609..." 
                               required 
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="block text-xs font-black text-green-800 uppercase tracking-widest ml-1">Access Token</label>
                             <input 
                               value={waAccessToken}
                               onChange={e => setWaAccessToken(e.target.value)}
                               type="password" 
                               className="w-full px-5 py-3 border border-green-200 rounded-2xl text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" 
                               placeholder="EAAD..." 
                               required 
                             />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                             <label className="block text-xs font-black text-green-800 uppercase tracking-widest ml-1">Business Account ID (Optional)</label>
                             <input 
                               value={waBusinessId}
                               onChange={e => setWaBusinessId(e.target.value)}
                               type="text" 
                               className="w-full px-5 py-3 border border-green-200 rounded-2xl text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" 
                               placeholder="e.g. 1045..." 
                             />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                              <button 
                                type="submit" 
                                disabled={isConnectingWhatsApp || !waPhoneNumberId || !waAccessToken}
                                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-green-200 flex items-center gap-2 disabled:opacity-50"
                              >
                                {isConnectingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isConnectingWhatsApp ? "Connecting..." : "Save WhatsApp Config"}
                              </button>
                          </div>
                        </form>

                        {/* Remote Control Note */}
                        <div className="mt-8 bg-black/5 border border-green-200/50 rounded-2xl p-5 backdrop-blur-sm">
                            <h4 className="text-[10px] font-black text-green-800 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <Zap className="w-3 h-3 fill-green-600 text-green-600" /> AI Remote Control Active
                            </h4>
                            <p className="text-xs text-green-800/70 leading-relaxed font-medium">
                                WhatsApp is configured as the <strong>Command Center</strong> for your AI Co-Founder. 
                                <br/><br/>
                                • <strong>Instructions Only:</strong> Incoming messages from your connected number trigger autonomous research and content creation.
                                <br/>
                                • <strong>Privacy First:</strong> Your leads/customers will NOT receive automated replies from the Orchestrator. The AI only follows YOUR commands.
                            </p>
                        </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {activeTab === "websites" && (
            <div className="p-8 animate-in fade-in slide-in-from-right-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Website Blocks</h2>
                    <p className="text-sm text-gray-500">Push published content automatically to your own website.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Add New Site */}
                <form onSubmit={handleAddWebsite} className="p-5 border border-indigo-100 bg-indigo-50/30 rounded-xl space-y-4">
                  <h3 className="font-bold text-indigo-900 text-sm">Add New Website</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-indigo-800 mb-1">Website Name</label>
                      <input 
                        value={newSiteName} onChange={e => setNewSiteName(e.target.value)}
                        type="text" placeholder="e.g. Main Blog" className="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm outline-none" required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-indigo-800 mb-1">Website URL</label>
                      <input 
                        value={newSiteUrl} onChange={e => setNewSiteUrl(e.target.value)}
                        type="url" placeholder="https://example.com" className="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm outline-none" required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-800 mb-1">Webhook URL (Your endpoint)</label>
                    <input 
                      value={newSiteWebhook} onChange={e => setNewSiteWebhook(e.target.value)}
                      type="url" placeholder="https://example.com/api/webhook" className="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm outline-none" required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="submit" 
                      disabled={isAddingSite || !newSiteName || !newSiteUrl || !newSiteWebhook}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {isAddingSite ? "Adding..." : "Add Website"}
                    </button>
                  </div>
                </form>

                {/* List Sites */}
                {isLoadingWebsites ? (
                  <div className="py-6 flex justify-center"><Loader2 className="w-6 h-6 text-gray-300 animate-spin" /></div>
                ) : websites.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                    No websites connected yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 text-sm">Connected Websites</h3>
                    {websites.map(site => (
                      <div key={site.id} className="p-4 border border-gray-200 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900">{site.name}</h4>
                            <p className="text-xs text-gray-500">{site.siteUrl}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteWebsite(site.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">API Key for your webhook</p>
                          <code className="text-xs text-indigo-600 font-mono select-all bg-indigo-50 px-2 py-1 rounded">{site.apiKey}</code>
                          <p className="text-[10px] text-gray-400 mt-2">
                            A POST request will be sent to <b>{site.webhookUrl}</b> whenever you publish content to this website block.
                          </p>
                        </div>
                        {/* D7: Embed widget snippet */}
                        <div className="mt-3 bg-gray-900 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-emerald-400 uppercase mb-2">📋 Embed Widget (paste in your website HTML)</p>
                          <code className="text-[11px] text-green-300 font-mono block whitespace-pre-wrap select-all leading-relaxed">{`<script\n  src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/widget.js"\n  data-apikey="${site.apiKey}"\n></script>`}</code>
                          <button
                            onClick={() => navigator.clipboard.writeText(`<script\n  src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/widget.js"\n  data-apikey="${site.apiKey}"\n></script>`)}
                            className="mt-2 text-[10px] text-emerald-400 hover:text-white font-bold uppercase tracking-wider transition-colors"
                          >
                            Copy Snippet →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "examples" && (
            <div className="p-8 animate-in fade-in slide-in-from-right-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Golden Examples</h2>
                    <p className="text-sm text-gray-500">Provide top-performing posts so the AI learns your exact style.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">LinkedIn (High Engagement)</span>
                  </div>
                  <p className="text-sm text-gray-700">&quot;They said real estate in Nagpur was dead. I just closed 5 deals in MIHAN this week...&quot;</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="p-8 animate-in fade-in slide-in-from-right-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">My Profile</h2>
                  <p className="text-sm text-gray-500 font-medium">Update your display name and password.</p>
                </div>
              </div>

              {profileError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{profileError}</div>
              )}
              {profileSuccess && (
                <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {profileSuccess}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none max-w-md"
                  />
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={profileCurrentPassword}
                        onChange={e => setProfileCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={profileNewPassword}
                        onChange={e => setProfileNewPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md disabled:opacity-50"
                >
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="p-8 animate-in fade-in slide-in-from-right-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Notifications</h2>
                  <p className="text-sm text-gray-500 font-medium">Control how and when we contact you.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Email Alerts</h3>
                    <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                        {[
                            { id: "succ", label: "Notify on Publish Success", desc: "Get an email every time a post goes live." },
                            { id: "fail", label: "Notify on Publish Failure", desc: "Crucial for re-authenticating expired tokens." },
                            { id: "dig", label: "Weekly Strategy Digest", desc: "Monday morning analysis of your weekly performance." }
                        ].map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{item.label}</p>
                                    <p className="text-xs text-gray-400 font-medium">{item.desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">WhatsApp Hooks</h3>
                    <div className="bg-green-50/50 border border-green-100 rounded-3xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-600 text-white rounded-2xl shrink-0">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-green-900">WhatsApp Notifications</p>
                                <p className="text-xs text-green-700 font-medium">Get real-time alerts on your primary WhatsApp number.</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-white text-green-600 border border-green-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all">Enable</button>
                    </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="p-8 animate-in fade-in slide-in-from-right-2">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Plan & Billing</h2>
                        <p className="text-sm text-gray-500 font-medium">Manage your subscription and usage credits.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Current Plan</p>
                        <h3 className="text-3xl font-black mb-4 tracking-tighter">Creator Pro</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-lg font-bold">₹</span>
                            <span className="text-4xl font-black">2,499</span>
                            <span className="text-sm opacity-60">/ month</span>
                        </div>
                        <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all">Manage Subscription</button>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Available Credits</p>
                            <h3 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">1,240</h3>
                            <p className="text-xs font-medium text-gray-400">Used 760 of 2,000 credits this month.</p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900">Next auto-refill</span>
                            <span className="text-xs font-bold text-gray-500">Oct 29, 2026</span>
                        </div>
                    </div>
                </div>
            </div>
          )}
          {activeTab === "project-media" && <ProjectMediaTab />}

          {activeTab === "ai-engine" && (
            <div className="p-8 animate-in fade-in slide-in-from-right-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">AI Engine</h2>
                  <p className="text-sm text-gray-500">How your AI Content Partner thinks and writes.</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Hybrid Engine Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-8 border border-indigo-800">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-10 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-5">
                      <Zap className="w-3.5 h-3.5 text-indigo-300" />
                      <span className="text-xs font-bold text-indigo-100 tracking-wider uppercase">Hybrid Intelligence Engine</span>
                    </div>
                    <p className="text-white/90 font-medium leading-relaxed max-w-2xl">
                      Contentsathi uses a <strong className="text-white">dual-engine AI architecture</strong> — Gemini 2.5 for strategic reasoning, research, and quality review, and <strong className="text-white">Sarvam-M for native Indian language intelligence</strong> across all 10 languages. This is why content in Hindi, Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Punjabi, and Odia feels genuinely native — not translated.
                    </p>
                  </div>
                </div>

                {/* Two Engine Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-6 border border-blue-100 bg-blue-50/50 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-blue-600 rounded-xl">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Gemini 2.5 Flash</h3>
                        <p className="text-xs text-gray-500">Strategic Reasoning Engine</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 font-medium">
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />Intent Analyzer — understands your goal</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />Research Context Agent — local data</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />Quality Reviewer — fixes hooks and CTAs</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />English content writing across all platforms</li>
                    </ul>
                  </div>

                  <div className="p-6 border border-violet-100 bg-violet-50/50 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-violet-600 rounded-xl">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Sarvam-M</h3>
                        <p className="text-xs text-gray-500">India&apos;s Sovereign Language AI</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 font-medium">
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />Native transcreation in 10 Indian languages</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />Dialect-aware (Nagpur Marathi, Hyderabadi Telugu...)</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />Culturally accurate idioms and CTAs</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />Free per token — no extra cost to you</li>
                    </ul>
                  </div>
                </div>

                {/* SARVAM API Key Setup */}
                <div className="p-6 border border-amber-100 bg-amber-50/50 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-amber-900 mb-1">Activate 10-Language Support</h4>
                      <p className="text-sm text-amber-800 font-medium leading-relaxed mb-4">
                        To enable native Indian language content generation, add your free <strong>SARVAM_API_KEY</strong> to your <code className="bg-amber-100 px-1 rounded">.env.local</code> file.
                        Get your key for free at{" "}
                        <a href="https://cloud.sarvam.ai" target="_blank" rel="noreferrer" className="underline font-bold hover:text-amber-900">cloud.sarvam.ai</a>.
                      </p>
                      <div className="bg-gray-900 rounded-xl p-4">
                        <p className="text-emerald-400 text-xs font-mono mb-1"># .env.local</p>
                        <code className="text-green-300 text-sm font-mono">SARVAM_API_KEY=your_key_here</code>
                      </div>
                      <p className="text-xs text-amber-700 mt-3 font-medium">
                        <strong>Powered by Sarvam AI</strong> — India&apos;s sovereign AI for native Indian language intelligence.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* ── QR CODE MODAL ────────────────────────────────────── */}
      {showQRModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowQRModal(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-black transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-[2rem] flex items-center justify-center text-green-600 mx-auto mb-6 shadow-sm border border-green-200">
                <MessageCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Connect via QR</h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">
                Scan the QR code below and hit <span className="text-green-600 font-bold">&quot;Send&quot;</span> on WhatsApp to instantly link your account to Contentsathi.
              </p>

              <div className="relative inline-block p-6 bg-white border-2 border-green-100 rounded-[2.5rem] shadow-xl shadow-green-100/50 mb-8">
                <QRCodeCanvas 
                  value={`https://wa.me/918793082163?text=Link_Account_${userId}`} 
                  size={200}
                  level="H"
                  includeMargin={false}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                   <Zap className="w-32 h-32 text-green-600 rotate-12" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 font-bold border border-gray-100 shadow-sm shrink-0">1</div>
                  <p className="text-xs font-bold text-gray-600">Scan code with any QR scanner or Camera.</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 font-bold border border-gray-100 shadow-sm shrink-0">2</div>
                  <p className="text-xs font-bold text-gray-600">Hit <span className="text-green-600">&quot;Send&quot;</span> on the auto-filled message.</p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <Shield className="w-3 h-3" /> Secure & Private
              </div>
            </div>

            <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
               <button 
                onClick={() => setShowQRModal(false)}
                className="text-sm font-black text-indigo-600 hover:text-indigo-700"
               >
                 I&apos;ve sent the message. Done!
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function ProjectMediaTab() {
    const [projectAssets, setProjectAssets] = useState<any[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Form state
    const [assetName, setAssetName] = useState("");
    const [assetDesc, setAssetDesc] = useState("");
    const [assetType, setAssetType] = useState("image");
    const [assetCorridor, setAssetCorridor] = useState("");
    const [assetProject, setAssetProject] = useState("");
    const [useInChat, setUseInChat] = useState(true);
    const [useAsKnowledge, setUseAsKnowledge] = useState(true);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const CORRIDORS = ["Wardha Road", "Besa", "MIHAN", "Ring Road", "Hingna Road", "Saraswati Nagri", "Godni", "Other"];
    const FILE_TYPES = [
      { id: "image",        label: "Site/Dev Image", icon: ImageIcon,  accept: "image/*" },
      { id: "location_map", label: "Location Map",   icon: MapPin,     accept: "image/*" },
      { id: "brochure",     label: "Brochure (PDF)", icon: FileText,   accept: ".pdf" },
      { id: "video",        label: "Video",          icon: Video,      accept: "video/*" },
    ];

    const fetchProjectAssets = useCallback(async () => {
      setLoadingAssets(true);
      try {
        const res = await fetch("/api/project-assets");
        if (res.ok) {
          const data = await res.json();
          setProjectAssets(data.assets || []);
        }
      } catch {} finally { setLoadingAssets(false); }
    }, []);

    useEffect(() => { fetchProjectAssets(); }, [fetchProjectAssets]);

    const handleFilePick = (files: FileList | null) => {
      if (!files?.length) return;
      const f = files[0];
      setPendingFile(f);
      if (!assetName) setAssetName(f.name.replace(/\.[^.]+$/, ""));
    };

    const handleUpload = async () => {
      if (!pendingFile || !assetName) { toast.error("File and name are required."); return; }
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", pendingFile);
        form.append("name", assetName);
        form.append("description", assetDesc);
        form.append("fileType", assetType);
        form.append("corridor", assetCorridor);
        form.append("projectName", assetProject);
        form.append("useInChat", String(useInChat));
        form.append("useAsKnowledge", String(useAsKnowledge));

        const res = await fetch("/api/project-assets", { method: "POST", body: form });
        if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
        toast.success(`✅ "${assetName}" uploaded to Project Knowledge Base!`);
        setPendingFile(null); setAssetName(""); setAssetDesc(""); setAssetCorridor(""); setAssetProject("");
        fetchProjectAssets();
      } catch (e: any) {
        toast.error(e.message || "Upload failed");
      } finally { setUploading(false); }
    };

    const handleDelete = async (id: string) => {
      if (!confirm("Remove this asset?")) return;
      await fetch(`/api/project-assets?id=${id}`, { method: "DELETE" });
      setProjectAssets(prev => prev.filter(a => a.id !== id));
      toast.success("Removed.");
    };

    const handleToggle = async (id: string, field: "useInChat" | "useAsKnowledge", current: boolean) => {
      await fetch("/api/project-assets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, [field]: !current }) });
      setProjectAssets(prev => prev.map(a => a.id === id ? { ...a, [field]: !current } : a));
    };

    const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
      image:        { icon: ImageIcon, color: "text-blue-500 bg-blue-50",    label: "Site Image" },
      location_map: { icon: MapPin,    color: "text-emerald-500 bg-emerald-50", label: "Location Map" },
      brochure:     { icon: FileText,  color: "text-orange-500 bg-orange-50",  label: "Brochure" },
      video:        { icon: Video,     color: "text-purple-500 bg-purple-50",  label: "Video" },
    };

    return (
      <div className="p-8 animate-in fade-in slide-in-from-right-2 space-y-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Project Media & Knowledge Base</h2>
            <p className="text-sm text-gray-500 font-medium">Upload development images, location maps, brochures, and videos. ContentSathi AI uses these directly in messages and as AI context.</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-emerald-600 fill-current" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-0.5">How This Works</p>
            <p className="text-xs font-medium text-emerald-700 leading-relaxed">
              <strong>Use in Chat:</strong> Share directly via WhatsApp or attach to generated posts. &nbsp;
              <strong>Knowledge Base:</strong> ContentSathi AI reads brochure text, image context, and location facts when generating content — so every post reflects your actual project, not generic copy.
            </p>
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm space-y-5">
          <h3 className="text-base font-black text-gray-900">Upload New Asset</h3>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFilePick(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragOver ? "border-emerald-400 bg-emerald-50" :
              pendingFile ? "border-emerald-300 bg-emerald-50" :
              "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
            }`}
          >
            <input ref={fileInputRef} type="file" className="hidden"
              accept={FILE_TYPES.find(t => t.id === assetType)?.accept || "*"}
              onChange={e => handleFilePick(e.target.files)} />
            <Upload className={`w-10 h-10 mx-auto mb-3 ${ pendingFile ? "text-emerald-500" : "text-gray-300" }`} />
            {pendingFile ? (
              <>
                <p className="text-sm font-black text-emerald-700">{pendingFile.name}</p>
                <p className="text-xs text-emerald-500 font-medium mt-1">{(pendingFile.size / 1024).toFixed(0)} KB · Click to change</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-600">Drag & drop or click to upload</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Images, PDFs, Videos — max 50 MB</p>
              </>
            )}
          </div>

          {/* Asset Type Pills */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Asset Type</label>
            <div className="flex flex-wrap gap-2">
              {FILE_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setAssetType(t.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                      assetType === t.id ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}>
                    <Icon className="w-3.5 h-3.5" />{t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Asset Name *</label>
              <input value={assetName} onChange={e => setAssetName(e.target.value)}
                placeholder="e.g. Saraswati Nagri Phase 2 Brochure"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Project Name</label>
              <input value={assetProject} onChange={e => setAssetProject(e.target.value)}
                placeholder="e.g. Saraswati Nagri"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Corridor</label>
              <select value={assetCorridor} onChange={e => setAssetCorridor(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400 outline-none bg-white">
                <option value="">Select corridor…</option>
                {CORRIDORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Description / AI Context</label>
              <input value={assetDesc} onChange={e => setAssetDesc(e.target.value)}
                placeholder="e.g. Aerial drone shot showing Ring Road proximity"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400 outline-none" />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4">
            <button onClick={() => setUseInChat(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${
                useInChat ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-400"
              }`}>
              {useInChat ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              Use in Chat / WhatsApp
            </button>
            <button onClick={() => setUseAsKnowledge(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${
                useAsKnowledge ? "bg-violet-50 border-violet-200 text-violet-700" : "bg-gray-50 border-gray-200 text-gray-400"
              }`}>
              {useAsKnowledge ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              Feed to AI Knowledge Base
            </button>
          </div>

          <button onClick={handleUpload} disabled={!pendingFile || !assetName || uploading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-100 transition-all disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading & Indexing…" : "Upload to Knowledge Base"}
          </button>
        </div>

        {/* Asset Gallery */}
        <div>
          <h3 className="text-base font-black text-gray-900 mb-4">
            Project Assets
            <span className="ml-2 text-xs font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{projectAssets.length}</span>
          </h3>
          {loadingAssets ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
            </div>
          ) : projectAssets.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-400">No project assets yet.</p>
              <p className="text-xs text-gray-400 font-medium mt-1">Upload site images, brochures, or videos above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectAssets.map(asset => {
                const tm = TYPE_META[asset.fileType] || TYPE_META.image;
                const Icon = tm.icon;
                const isImage = ["image", "location_map"].includes(asset.fileType);
                return (
                  <div key={asset.id} className="bg-white border border-gray-100 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    {/* Preview */}
                    {isImage && asset.fileUrl ? (
                      <div className="h-36 bg-gray-50 overflow-hidden">
                        <img src={asset.fileUrl} alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className={`h-36 flex items-center justify-center ${tm.color}`}>
                        <Icon className="w-14 h-14 opacity-30" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-tight">{asset.name}</p>
                          {asset.projectName && <p className="text-[10px] text-gray-400 font-bold mt-0.5">{asset.projectName} · {asset.corridor || ""}</p>}
                        </div>
                        <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full border ${tm.color}`}>{tm.label}</span>
                      </div>
                      {asset.description && (
                        <p className="text-[11px] text-gray-500 font-medium mb-3 line-clamp-2">{asset.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button onClick={() => handleToggle(asset.id, "useInChat", asset.useInChat)}
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${
                            asset.useInChat ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-400 border-gray-200"
                          }`}>💬 Chat</button>
                        <button onClick={() => handleToggle(asset.id, "useAsKnowledge", asset.useAsKnowledge)}
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${
                            asset.useAsKnowledge ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-gray-50 text-gray-400 border-gray-200"
                          }`}>🧠 AI Brain</button>
                        {asset.fileUrl && (
                          <a href={asset.fileUrl} target="_blank" rel="noreferrer"
                            className="text-[10px] font-black px-2.5 py-1 rounded-full border bg-blue-50 text-blue-600 border-blue-200">👁 View</a>
                        )}
                        <button onClick={() => handleDelete(asset.id)}
                          className="ml-auto text-[10px] font-black text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default function Settings() {
  return (
    <Suspense fallback={
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
