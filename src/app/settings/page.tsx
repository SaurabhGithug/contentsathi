"use client";

import { useState, useEffect } from "react";
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
  AlertCircle
} from "lucide-react";

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  x: Twitter,
  youtube: Youtube,
  facebook: Facebook,
  whatsapp: MessageCircle,
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState("brand");
  
  // Brand Form State
  const [brandName, setBrandName] = useState("ContentSaarthi Demo");
  const [industry, setIndustry] = useState("Real Estate & Land Development");
  const [brandDesc, setBrandDesc] = useState("We are a premium land developer based in Nagpur focusing on high-appreciation residential plots near upcoming infrastructure.");
  const [audience, setAudience] = useState("Investors, first-time buyers, IT professionals looking for second homes.");
  const [tone, setTone] = useState("Professional but approachable");
  const [primaryLang, setPrimaryLang] = useState("English");
  const [secondaryLang, setSecondaryLang] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "linkedin", "whatsapp", "youtube"]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  useEffect(() => {
    loadBrainData();
    // Load user profile name
    fetch("/api/user/profile")
      .then(r => r.json())
      .then(u => { if (u.name) setProfileName(u.name); })
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
        fetchWebsites();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingSite(false);
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

  const handleLoadPreset = () => {
    setBrandName("Saraswati Nagari");
    setIndustry("Premium Residential Real Estate");
    setBrandDesc("Saraswati Nagari by Sarthi Developers is a premium plotting project in Nagpur (Besa-Pipla Road). We offer clear-title, NMRDA-sanctioned plots with modern amenities like underground cabling, cement roads, and lush gardens.");
    setAudience("IT professionals at MIHAN, families looking for a peaceful yet connected home, and long-term land investors in Nagpur.");
    setTone("Professional, Trustworthy, and Visionary");
    setPrimaryLang("Marathi");
    setSecondaryLang("English");
    setSelectedPlatforms(["instagram", "linkedin", "whatsapp", "facebook", "youtube"]);
    alert("Saraswati Nagari Preset loaded! Click Save to apply.");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settings & Integrations</h1>
        <p className="text-gray-500 mt-1">Configure your AI persona, social channels, and website hooks.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab("brand")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "brand" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Briefcase className="w-5 h-5" /> Brand & Niche
            </button>
            <button 
              onClick={() => setActiveTab("languages")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "languages" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Globe className="w-5 h-5" /> Languages & Tone
            </button>
            <button 
              onClick={() => setActiveTab("accounts")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "accounts" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Share2 className="w-5 h-5" /> Connected Accounts
            </button>
            <button 
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "profile" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <User className="w-5 h-5" /> Profile
            </button>
            <button 
              onClick={() => setActiveTab("websites")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "websites" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <LinkIcon className="w-5 h-5" /> Website Blocks
            </button>
            <button 
              onClick={() => setActiveTab("examples")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "examples" ? "bg-amber-50 text-amber-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Star className="w-5 h-5 text-amber-500" /> Golden Examples
            </button>
            <button 
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "notifications" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <AlertCircle className="w-5 h-5" /> Notifications
            </button>
            <button 
              onClick={() => setActiveTab("billing")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "billing" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Zap className="w-5 h-5" /> Plan & Billing
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
                <button 
                  onClick={handleLoadPreset}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                >
                  <Star className="w-3.5 h-3.5 fill-emerald-600" />
                  Load Saraswati Nagari Preset
                </button>
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
                            <div>
                                <h3 className="text-xl font-black text-green-900 tracking-tight">WhatsApp Business API</h3>
                                <p className="text-sm font-medium text-green-700">Enter your Meta Developer credentials manually.</p>
                            </div>
                        </div>
                        
                        <form action="/api/auth/whatsapp/connect" method="POST" className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          <div className="space-y-2">
                             <label className="block text-xs font-black text-green-800 uppercase tracking-widest ml-1">Phone Number ID</label>
                             <input name="phoneNumberId" type="text" className="w-full px-5 py-3 border border-green-200 rounded-2xl text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="e.g. 10609..." required />
                          </div>
                          <div className="space-y-2">
                             <label className="block text-xs font-black text-green-800 uppercase tracking-widest ml-1">Access Token</label>
                             <input name="accessToken" type="password" className="w-full px-5 py-3 border border-green-200 rounded-2xl text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="EAAD..." required />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                              <button type="submit" className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-green-200 flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                Save WhatsApp Config
                              </button>
                          </div>
                        </form>
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


        </div>
      </div>
    </div>
  );
}
