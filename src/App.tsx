import React, { useState, useEffect } from "react";
import { 
  FileText, Shield, User, Users, PlusCircle, ArrowRight, 
  HelpCircle, Eye, RefreshCw, FileSignature, BookOpen, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Contract, ContractStatus, User as AppUser } from "./types.js";
import NotificationBell from "./components/NotificationBell.js";
import ContractWorkspace from "./components/ContractWorkspace.js";
import AIReviewCoPilot from "./components/AIReviewCoPilot.js";
import ContractAuditTrail from "./components/ContractAuditTrail.js";

export default function App() {
  // Users available for mock switching
  const [sessionUsers, setSessionUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Contracts matching current tenant bounds
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Active workspace tab
  // "editor" | "copilot" | "audit"
  const [activeTab, setActiveTab] = useState<"editor" | "copilot" | "audit">("editor");

  // State sync trigger to update submodules synchronously
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load available users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (response.ok) {
          const data = await response.json();
          setSessionUsers(data);
          // Default to Client A
          const defaultUser = data.find((u: AppUser) => u.id === "user-client-a") || data[0];
          setCurrentUser(defaultUser);
        }
      } catch (e) {
        console.error("Failed to load mock users", e);
      }
    };
    fetchUsers();
  }, []);

  // Fetch contracts matching current user context
  const fetchContracts = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await fetch("/api/contracts", {
        headers: {
          "x-user-id": currentUser.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
        // Retain selection if the selected contract is still inside current tenant boundary
        const retainsSel = data.some((c: Contract) => c.id === selectedContractId);
        if (!retainsSel && data.length > 0) {
          setSelectedContractId(data[0].id);
        } else if (data.length === 0) {
          setSelectedContractId(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [currentUser, refreshTrigger]);

  const activeContract = contracts.find((c) => c.id === selectedContractId) || null;

  // Trigger synchronize across panels
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleUserSwitch = (userId: string) => {
    const sw = sessionUsers.find((u) => u.id === userId);
    if (sw) {
      setCurrentUser(sw);
      // Reset selected tab & ID triggers on switches to preserve logical boundaries
      setSelectedContractId(null);
      setActiveTab("editor");
      handleRefresh();
    }
  };

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.SUBMITTED:
        return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/10";
      case ContractStatus.IN_REVIEW:
        return "bg-amber-50 text-amber-800 ring-1 ring-amber-600/10";
      case ContractStatus.NEEDS_CHANGES:
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-600/10 animate-pulse";
      case ContractStatus.APPROVED:
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10";
      default:
        return "bg-slate-50 text-slate-700 ring-1 ring-slate-600/10";
    }
  };

  if (!currentUser) {
    return (
      <div id="full-page-loading" className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs text-slate-500 font-mono">Initializing ClauseTrack Safe Tenancy bounds...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="application-root" className="min-h-screen flex flex-col antialiased bg-slate-50 font-sans">
      
      {/* SECTION 1: ROLE SWITCHER SYSTEM BAR */}
      <div id="session-persona-switcher" className="bg-slate-900 text-slate-100 py-2.5 px-4 sm:px-6 border-b border-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs z-50">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-300">Evaluate Roles & Multi-Tenancy:</span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {sessionUsers.map((usr) => (
            <button
              key={usr.id}
              onClick={() => handleUserSwitch(usr.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                currentUser?.id === usr.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{usr.name}</span>
              <span className={`text-[9px] uppercase font-mono px-1 rounded ${
                usr.role === "attorney" ? "bg-purple-950 text-purple-200" : "bg-slate-950 text-slate-400"
              }`}>
                {usr.role}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: APPLICATION HEADER */}
      <header id="clausetrack-main-header" className="bg-[#0f172a] text-white border-b border-slate-800 py-3.5 px-4 sm:px-6 flex items-center justify-between shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-sm shadow-indigo-500/30">
            C
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-sm uppercase">ClauseTrack</span>
              <span className="text-[10px] bg-slate-800 text-indigo-400 px-1.5 py-0.5 rounded-md font-bold font-mono border border-slate-700">v1.0</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Secured External Law Firm Portal</p>
          </div>
        </div>

        {currentUser && (
          <div id="header-user-status" className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-slate-200 block">{currentUser.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                Tenancy: <strong className="text-indigo-400">{currentUser.tenantId}</strong>
              </span>
            </div>
            <NotificationBell currentUser={currentUser} refreshTrigger={refreshTrigger} />
          </div>
        )}
      </header>

      {/* SECTION 3: CORE COMPLIANCE AND REVIEW STAGE DASHBOARD */}
      <main id="app-main-workspace" className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
        
        {/* SIDEBAR: CONTRACTS REVIEWS COLLECTION LIST */}
        <aside id="dashboard-sidebar" className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                Pipeline Documents ({contracts.length})
              </h2>
              <button 
                onClick={fetchContracts}
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded transition-colors"
                title="Refresh Listing"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-indigo-500" />
                Verifying tenant boundaries...
              </div>
            ) : contracts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-3">
                <p>No active contracts found matching tenant: "{currentUser?.tenantId}"</p>
              </div>
            ) : (
              <div id="contracts-sidebar-scroll" className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                {contracts.map((item) => (
                  <button
                    id={`contract-sidebar-item-${item.id}`}
                    key={item.id}
                    onClick={() => {
                      setSelectedContractId(item.id);
                      setActiveTab("editor");
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-md border text-xs transition-all flex flex-col gap-1.5 relative group cursor-pointer ${
                      selectedContractId === item.id
                        ? "bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium"
                        : "bg-white border-slate-200 hover:bg-slate-50/50 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <h3 className={`font-semibold text-xs leading-tight transition-colors line-clamp-2 ${
                        selectedContractId === item.id ? "text-indigo-800" : "text-slate-700 group-hover:text-indigo-600"
                      }`}>
                        {item.title}
                      </h3>
                      {currentUser?.role === "attorney" && (
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                          Tenant: <strong className="text-slate-600">{item.tenantId}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono leading-none font-bold ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono font-medium">
                        {new Date(item.requestedDeadline).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {currentUser?.role === "client" && (
              <button
                id="initiate-intake-sidebar-btn"
                onClick={() => {
                  setSelectedContractId(null);
                  setSelectedContractId(null);
                  setTimeout(() => {
                    const wsBtn = document.getElementById("start-intake-btn");
                    if (wsBtn) wsBtn.click();
                  }, 100);
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md transition-colors shadow-sm shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer mt-3"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                New Contract Intake
              </button>
            )}
          </div>

          {/* SECURITY & TENANCY BOUNDARY BANNER */}
          <div id="security-assurance-card" className="bg-slate-900 border border-slate-950 text-slate-300 p-4 rounded-xl text-[11px] leading-relaxed space-y-2">
            <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              Logical Multi-Tenancy Isolations
            </h4>
            <p className="text-slate-400">
              Contract records are programmatically isolated under Client profiles. Client A can review and amend Acme Corp parameters but is strictly prevented from inspecting or inferring Client B's operations.
            </p>
          </div>
        </aside>

        {/* WORKSPACE AREA WITH TABS PANEL */}
        <section id="workspace-main-column" className="flex-1 w-full flex flex-col gap-4">
          {activeContract && (
            /* TAB CONTROLLER BAR */
            <div id="workspace-tabs-bar" className="bg-white border border-slate-200 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold text-slate-600 shadow-xs">
              <button
                id="tab-btn-editor"
                onClick={() => setActiveTab("editor")}
                className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "editor"
                    ? "bg-slate-100 text-slate-900"
                    : "hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Workspace Editor
              </button>
              
              <button
                id="tab-btn-copilot"
                onClick={() => setActiveTab("copilot")}
                className="flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:bg-slate-50 hover:text-slate-800"
              >
                <Layers className="w-3.5 h-3.5" />
                AI Reviews & Co-Pilot
              </button>

              <button
                id="tab-btn-audit"
                onClick={() => setActiveTab("audit")}
                className="flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:bg-slate-50 hover:text-slate-800"
              >
                <Shield className="w-3.5 h-3.5" />
                Secured Trace Trails
              </button>
            </div>
          )}

          {/* CHOSEN TAB VIEWS */}
          <div id="active-tab-panel" className="flex-1">
            {activeTab === "editor" ? (
              <ContractWorkspace 
                contract={activeContract} 
                currentUser={currentUser} 
                onRefresh={handleRefresh}
                onSelectContract={(id) => {
                  setSelectedContractId(id);
                  setActiveTab("editor");
                }}
              />
            ) : activeTab === "copilot" && activeContract ? (
              <AIReviewCoPilot 
                contract={activeContract} 
                currentUser={currentUser} 
                onRefresh={handleRefresh}
                refreshTrigger={refreshTrigger}
              />
            ) : activeTab === "audit" && activeContract ? (
              <ContractAuditTrail 
                contract={activeContract} 
                currentUser={currentUser} 
                refreshTrigger={refreshTrigger}
              />
            ) : (
              <div className="p-12 text-center text-slate-400">Loading workspace views...</div>
            )}
          </div>
        </section>

      </main>

      {/* FOOTER STATS PANEL */}
      <footer id="clausetrack-main-footer" className="bg-white border-t border-slate-200 py-3 px-4 sm:px-6 mt-12 text-center text-[11px] text-slate-400 font-mono">
        &copy; 2026 ClauseTrack Legal Review Suite. All transactions recorded under non-destructive append-only audit protocols.
      </footer>

    </div>
  );
}
