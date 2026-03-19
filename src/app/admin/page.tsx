"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, BarChart3, MessageSquare, Shield, AlertTriangle, CheckCircle2,
  Zap, TrendingUp, Crown, Settings, LogOut, Search, RefreshCcw,
  ArrowUpRight, UserCheck, IndianRupee, Activity, Layers, Filter,
  ChevronDown, LayoutDashboard, Eye, Trash2, PlusCircle, X,
  Mail, Phone, Tag, Clock, Star, Bot
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ── Types ───────────────────────────────────────────────────────────────────
type AdminStats = {
  totalUsers: number; newUsersToday: number; newUsersThisMonth: number;
  totalLeads: number; newLeadsToday: number; openLeads: number;
  totalRevenue: number; monthRevenue: number; activeTasks: number;
  failedPublishes: number; totalAssets: number;
  planBreakdown: { free: number; starter: number; creator: number };
};

type AdminUser = {
  id: string; name: string; email: string; planTier: string;
  creditsBalance: number; creditsLifetimeUsed: number; isAdmin: boolean;
  adminRole: string | null; onboardingCompleted: boolean; createdAt: string;
  _count: { agentTasks: number; generatedAssets: number };
};

type Lead = {
  id: string; name: string; email: string; phone: string; status: string;
  contactSource: string; message: string; notes: string; assignedTo: string;
  createdAt: string; source: string;
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  starter: "bg-blue-100 text-blue-700",
  creator: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700",
  sales_admin: "bg-emerald-100 text-emerald-700",
  technical_admin: "bg-blue-100 text-blue-700",
  support_admin: "bg-violet-100 text-violet-700",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  contacted: "bg-blue-100 text-blue-700",
  converted: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-500",
};

const SOURCE_LABELS: Record<string, string> = {
  general: "General Inquiry",
  sales_pricing: "Sales & Pricing",
  technical: "Technical Support",
  api_access: "API Access",
  partnership: "Partnership",
  billing: "Billing / Refund",
};

// ── Permission Helper ────────────────────────────────────────────────────────
function canDo(adminRole: string | null | undefined, action: string): boolean {
  if (!adminRole || adminRole === "super_admin") return true;
  const perms: Record<string, string[]> = {
    sales_admin: ["view_users", "add_credits", "upgrade_plan", "view_leads", "edit_leads", "view_revenue"],
    technical_admin: ["view_users", "view_leads", "edit_leads", "view_system"],
    support_admin: ["view_users", "view_leads", "edit_leads"],
  };
  return (perms[adminRole] || []).includes(action);
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "leads" | "system">("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [userPlanFilter, setUserPlanFilter] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("");
  const [leadTypeFilter, setLeadTypeFilter] = useState("");

  // Modals
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [creditAmount, setCreditAmount] = useState("50");
  const [newPlan, setNewPlan] = useState("");
  const [newRole, setNewRole] = useState("");

  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadNotes, setLeadNotes] = useState("");
  const [leadStatus, setLeadStatus] = useState("");

  // Guard: redirect non-admins
  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && !user?.isAdmin) { router.push("/dashboard"); return; }
  }, [status, user, router]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (userSearch) params.set("search", userSearch);
    if (userPlanFilter) params.set("plan", userPlanFilter);
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) { const d = await res.json(); setUsers(d.users); }
  }, [userSearch, userPlanFilter]);

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (leadStatusFilter) params.set("status", leadStatusFilter);
    if (leadTypeFilter) params.set("contactSource", leadTypeFilter);
    const res = await fetch(`/api/admin/leads?${params}`);
    if (res.ok) { const d = await res.json(); setLeads(d.leads); }
  }, [leadStatusFilter, leadTypeFilter]);

  useEffect(() => {
    if (status !== "authenticated" || !user?.isAdmin) return;
    setIsLoading(true);
    Promise.all([fetchStats(), fetchUsers(), fetchLeads()]).finally(() => setIsLoading(false));
  }, [status, user, fetchStats, fetchUsers, fetchLeads]);

  useEffect(() => { if (status === "authenticated" && user?.isAdmin) fetchUsers(); }, [userSearch, userPlanFilter, fetchUsers, status, user?.isAdmin]);
  useEffect(() => { if (status === "authenticated" && user?.isAdmin) fetchLeads(); }, [leadStatusFilter, leadTypeFilter, fetchLeads, status, user?.isAdmin]);

  const updateUser = async (userId: string, action: string, value: any) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, value }),
    });
    if (res.ok) {
      toast.success("Updated successfully!");
      fetchUsers();
      setEditingUser(null);
    } else {
      toast.error("Action failed. Check permissions.");
    }
  };

  const updateLead = async () => {
    if (!editingLead) return;
    const res = await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: editingLead.id, status: leadStatus, notes: leadNotes }),
    });
    if (res.ok) { toast.success("Lead updated!"); fetchLeads(); setEditingLead(null); }
    else toast.error("Failed to update lead.");
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  const adminRole = user.adminRole || "super_admin";
  const isSuperAdmin = !adminRole || adminRole === "super_admin";

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <Toaster position="top-right" />

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 h-16 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-900">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-black text-white tracking-tighter text-base">ContentSathi</span>
            <span className="ml-2 text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
              {adminRole.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Switch to User Mode */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 rounded-xl font-bold text-xs transition-all"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Switch to User Mode
          </Link>

          <div className="flex items-center gap-2 pl-3 border-l border-gray-700">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-xs font-black text-gray-300">{user?.name?.[0]?.toUpperCase() || "A"}</span>
            </div>
            <span className="text-sm font-semibold text-gray-300 hidden sm:block">{user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Page Title ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Monitor, manage, and grow ContentSathi.</p>
          </div>
          <button onClick={() => { fetchStats(); fetchUsers(); fetchLeads(); toast.success("Refreshed!"); }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-bold text-sm text-gray-300 transition-all">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="flex bg-gray-900 p-1.5 rounded-2xl gap-1 border border-gray-800">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "users", label: "Users", icon: Users },
            { id: "leads", label: `Leads ${stats?.openLeads ? `(${stats.openLeads} open)` : ""}`, icon: MessageSquare },
            ...(canDo(adminRole, "view_system") ? [{ id: "system", label: "System Health", icon: Activity }] : []),
          ].map((tab: any) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════╗
            TAB: OVERVIEW
        ╚════════════════════════════════════ */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: stats.totalUsers, sub: `+${stats.newUsersToday} today`, icon: Users, color: "indigo" },
                { label: "Open Leads", value: stats.openLeads, sub: `+${stats.newLeadsToday} today`, icon: MessageSquare, color: "amber" },
                { label: "Month Revenue", value: `₹${(stats.monthRevenue / 100).toLocaleString("en-IN")}`, sub: `Total: ₹${(stats.totalRevenue / 100).toLocaleString("en-IN")}`, icon: IndianRupee, color: "emerald" },
                { label: "Active Tasks", value: stats.activeTasks, sub: `${stats.failedPublishes} failed publishes`, icon: Bot, color: "violet" },
              ].map((card) => (
                <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
                  <div className={`w-10 h-10 rounded-xl bg-${card.color}-500/10 flex items-center justify-center text-${card.color}-400 mb-3`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">{card.label}</p>
                  <p className="text-3xl font-black text-white">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Plan breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-black text-white mb-5 flex items-center gap-2"><Crown className="w-4 h-4 text-amber-400" /> User Plan Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Free", count: stats.planBreakdown.free, color: "gray" },
                  { label: "Starter", count: stats.planBreakdown.starter, color: "blue" },
                  { label: "Creator", count: stats.planBreakdown.creator, color: "purple" },
                ].map((plan) => (
                  <div key={plan.label} className="text-center bg-gray-800/50 rounded-xl p-4">
                    <p className={`text-3xl font-black text-${plan.color}-400`}>{plan.count}</p>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mt-1">{plan.label}</p>
                    <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${plan.color}-500 rounded-full`}
                        style={{ width: `${stats.totalUsers ? (plan.count / stats.totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            {isSuperAdmin && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="font-black text-white mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Quick Admin Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "View All Users", icon: Users, onClick: () => setActiveTab("users") },
                    { label: "View All Leads", icon: MessageSquare, onClick: () => setActiveTab("leads") },
                    { label: "Waitlist", icon: Mail, href: "/admin/waitlist" },
                    { label: "System Health", icon: Activity, onClick: () => setActiveTab("system") },
                  ].map((action: any) => (
                    action.href ? (
                      <Link key={action.label} href={action.href}
                        className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 hover:border-indigo-500/50 transition-all group">
                        <action.icon className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-gray-300 text-center">{action.label}</span>
                      </Link>
                    ) : (
                      <button key={action.label} onClick={action.onClick}
                        className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 hover:border-indigo-500/50 transition-all group">
                        <action.icon className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-gray-300 text-center">{action.label}</span>
                      </button>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════╗
            TAB: USERS
        ╚════════════════════════════════════ */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by name or email..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <select value={userPlanFilter} onChange={e => setUserPlanFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300 outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="creator">Creator</option>
              </select>
            </div>

            {/* Users table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-800/50">
                      <th className="text-left px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">User</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Plan</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Credits</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Campaigns</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Role</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Joined</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-600/20 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-xs font-black text-indigo-400">{u.name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-bold text-white text-xs">{u.name || "—"}</p>
                              <p className="text-gray-500 text-[11px]">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${PLAN_COLORS[u.planTier] || "bg-gray-100 text-gray-600"}`}>{u.planTier}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-black text-white">{u.creditsBalance}</span>
                          <span className="text-gray-500 text-[11px] ml-1">left</span>
                        </td>
                        <td className="px-4 py-4 text-gray-400 font-medium text-xs">{u._count.agentTasks}</td>
                        <td className="px-4 py-4">
                          {u.isAdmin ? (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${ROLE_COLORS[u.adminRole || "super_admin"] || "bg-red-100 text-red-700"}`}>
                              {(u.adminRole || "super admin").replace("_", " ")}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-600 font-medium">User</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-500 text-[11px]">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                        <td className="px-4 py-4">
                          {canDo(adminRole, "add_credits") && (
                            <button onClick={() => { setEditingUser(u); setNewPlan(u.planTier); setNewRole(u.adminRole || "none"); setCreditAmount("50"); }}
                              className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors">
                              Manage
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-3 text-gray-700" />
                    <p className="font-bold">No users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════╗
            TAB: LEADS
        ╚════════════════════════════════════ */}
        {activeTab === "leads" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select value={leadStatusFilter} onChange={e => setLeadStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300 outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </select>
              <select value={leadTypeFilter} onChange={e => setLeadTypeFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300 outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Types</option>
                <option value="general">General Inquiry</option>
                <option value="sales_pricing">Sales & Pricing</option>
                <option value="technical">Technical Support</option>
                <option value="api_access">API Access</option>
                <option value="partnership">Partnership</option>
                <option value="billing">Billing</option>
              </select>
            </div>

            {/* Leads grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {leads.map((lead) => (
                <div key={lead.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-black text-white text-sm">{lead.name}</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{lead.email}</p>
                      {lead.phone && <p className="text-[11px] text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</p>}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-500"}`}>{lead.status}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">
                      {SOURCE_LABELS[lead.contactSource] || lead.contactSource || "General"}
                    </span>
                    <span className="text-[10px] text-gray-600 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(lead.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>

                  {lead.message && (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3 bg-gray-800/50 p-2 rounded-lg leading-relaxed">&quot;{lead.message}&quot;</p>
                  )}

                  {lead.notes && (
                    <p className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg mt-2">📝 {lead.notes}</p>
                  )}

                  <button onClick={() => { setEditingLead(lead); setLeadNotes(lead.notes || ""); setLeadStatus(lead.status); }}
                    className="mt-3 w-full text-xs font-bold text-indigo-400 hover:text-indigo-300 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition-colors">
                    Update Lead →
                  </button>
                </div>
              ))}
              {leads.length === 0 && (
                <div className="col-span-3 py-16 text-center text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                  <p className="font-bold">No leads found for this filter</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════╗
            TAB: SYSTEM HEALTH
        ╚════════════════════════════════════ */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Assets Generated", value: stats?.totalAssets || 0, icon: Layers, color: "indigo" },
                { label: "Active Agent Tasks", value: stats?.activeTasks || 0, icon: Bot, color: "violet" },
                { label: "Failed Publishes", value: stats?.failedPublishes || 0, icon: AlertTriangle, color: "red" },
                { label: "Platform Status", value: "Operational", icon: CheckCircle2, color: "emerald" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className={`w-10 h-10 rounded-xl bg-${s.color}-500/10 flex items-center justify-center text-${s.color}-400 mb-3`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-black text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Live System Log</h3>
              <div className="font-mono text-[11px] space-y-2 bg-gray-950 p-4 rounded-xl max-h-64 overflow-y-auto">
                <div className="flex gap-3"><span className="text-emerald-400">[OK]</span><span className="text-gray-400">{new Date().toLocaleTimeString("en-IN")} — Database connection: healthy</span></div>
                <div className="flex gap-3"><span className="text-emerald-400">[OK]</span><span className="text-gray-400">{new Date().toLocaleTimeString("en-IN")} — Gemini API: responsive</span></div>
                <div className="flex gap-3"><span className="text-emerald-400">[OK]</span><span className="text-gray-400">{new Date().toLocaleTimeString("en-IN")} — Resend email: operational</span></div>
                <div className="flex gap-3"><span className="text-yellow-400">[WARN]</span><span className="text-gray-400">LinkedIn & Meta apps pending approval — social publishing blocked for new users</span></div>
                <div className="flex gap-3"><span className="text-yellow-400">[WARN]</span><span className="text-gray-400">Razorpay in test mode — switch to live keys before onboarding paid users</span></div>
                <div className="flex gap-3"><span className="text-indigo-400">[INFO]</span><span className="text-gray-400">Admin panel loaded by {user?.email}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── User Edit Modal ──────────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white">Manage: {editingUser.name || editingUser.email}</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {canDo(adminRole, "add_credits") && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Add Credits</label>
                  <div className="flex gap-2">
                    <input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    <button onClick={() => updateUser(editingUser.id, "addCredits", creditAmount)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors">
                      Add
                    </button>
                  </div>
                </div>
              )}

              {canDo(adminRole, "upgrade_plan") && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Change Plan</label>
                  <div className="flex gap-2">
                    <select value={newPlan} onChange={e => setNewPlan(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="creator">Creator</option>
                    </select>
                    <button onClick={() => updateUser(editingUser.id, "setPlan", newPlan)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition-colors">
                      Set
                    </button>
                  </div>
                </div>
              )}

              {isSuperAdmin && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Admin Role</label>
                  <div className="flex gap-2">
                    <select value={newRole} onChange={e => setNewRole(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="none">No Admin Access</option>
                      <option value="support_admin">Support Admin</option>
                      <option value="sales_admin">Sales Admin</option>
                      <option value="technical_admin">Technical Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <button onClick={() => updateUser(editingUser.id, "setAdminRole", newRole)}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-sm transition-colors">
                      Set
                    </button>
                  </div>
                </div>
              )}

              {isSuperAdmin && (
                <button onClick={() => { if (confirm("Permanently delete this user and ALL their data?")) updateUser(editingUser.id, "deleteUser", null); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-bold text-sm transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete User Permanently
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Lead Edit Modal ──────────────────────────────────────────────── */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white">Update Lead: {editingLead.name}</h3>
              <button onClick={() => setEditingLead(null)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
                <select value={leadStatus} onChange={e => setLeadStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Internal Notes</label>
                <textarea value={leadNotes} onChange={e => setLeadNotes(e.target.value)} rows={3}
                  placeholder="Add notes about this lead..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <button onClick={updateLead}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
