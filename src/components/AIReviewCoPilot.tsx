import React, { useState, useEffect } from "react";
import { Sparkles, Brain, CheckSquare, ListPlus, Terminal, RefreshCw, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Contract, User, RevisionAnalysis } from "../types.js";

interface AIReviewCoPilotProps {
  contract: Contract;
  currentUser: User;
  onRefresh: () => void;
  refreshTrigger: number;
}

export default function AIReviewCoPilot({ contract, currentUser, onRefresh, refreshTrigger }: AIReviewCoPilotProps) {
  const [summary, setSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  const [loadingChanges, setLoadingChanges] = useState(false);
  const [revisionAnalysis, setRevisionAnalysis] = useState<RevisionAnalysis | null>(null);

  // Load Attorney Co-Pilot Summary
  const fetchCoPilotSummary = async () => {
    try {
      setLoadingSummary(true);
      const response = await fetch(`/api/contracts/${contract.id}/copilot`, {
        headers: {
          "x-user-id": currentUser.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      } else {
        const err = await response.json();
        setSummary(`- **AI Analysis Blocked**: ${err.error || "Unable to parse document."}`);
      }
    } catch (e) {
      console.error(e);
      setSummary("- **Connection Timeout**: The local AI co-pilot server experienced an offline request loop.");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Check for resubmitted analyzer results (Phase 2 revision map)
  // Since real database captures the state during resubmission, let's load or allow initiating comparison analyses!
  const fetchRevisionAnalysis = async () => {
    // If the contract has previous log records of Edit & Resubmit, simulate or retrieve the translation metrics.
    // Let's invoke a live comparison or fetch mock assessment triggers!
    try {
      setLoadingChanges(true);
      
      // Let's do a simulation of Revision Analyzer based on active contract terms and client revisionNotes
      const response = await fetch(`/api/contracts/${contract.id}/resubmit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          content: contract.content,
          revisionNotes: contract.revisionNotes || "Verified standard pipeline compliance update.",
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.revisionAnalysis) {
          setRevisionAnalysis(data.revisionAnalysis);
        }
      }
    } catch (e) {
      console.error("Failed to run revision analyzer", e);
    } finally {
      setLoadingChanges(false);
    }
  };

  useEffect(() => {
    fetchCoPilotSummary();
    if (contract.revisionNotes) {
      // Trigger structural change compare automatically if the contract holds client revision indicators!
      fetchRevisionAnalysis();
    } else {
      setRevisionAnalysis(null);
    }
  }, [contract.id, refreshTrigger]);

  return (
    <div id="ai-copilot-container" className="space-y-6">
      {/* Visual Header */}
      <div id="ai-banner-header" className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 mt-1 animate-pulse" />
        <div>
          <h3 className="text-sm font-semibold text-indigo-950 flex items-center gap-1.5 font-sans">
            AI Studio Workspace Co-Pilot
          </h3>
          <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
            Harnessing Google AI Studio models to examine compliance risks, trace modifications, and outline summaries underneath strict non-disclosure bounds.
          </p>
        </div>
      </div>

      {/* SECTION 1: ATTORNEY CO-PILOT 3-BULLET SUMMARY */}
      <div id="copilot-sandbox-card" className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
              Attorney Co-Pilot Execution
            </h4>
          </div>
          <button
            id="refresh-copilot-btn"
            onClick={fetchCoPilotSummary}
            disabled={loadingSummary}
            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? "animate-spin" : ""}`} />
            Recalculate Summary
          </button>
        </div>

        {loadingSummary ? (
          <div className="py-8 text-center text-xs text-slate-400 font-sans">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-indigo-500" />
            Consulting legal models to write executive summaries...
          </div>
        ) : (
          <div className="space-y-3">
            <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase">
              3-Bullet-Point Legal Summary
            </span>
            <div id="copilot-summary-markdown" className="text-xs text-slate-700 font-sans leading-relaxed space-y-2.5">
              {summary ? (
                summary.split("\n").filter(line => line.trim()).map((line, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="mt-1 text-indigo-500 font-bold block text-sm leading-none">•</span>
                    <p className="flex-1 font-medium">{line.replace(/^[-\s*•]+/, "")}</p>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 italic">No summary generated. Click "Recalculate Summary" above.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: AI STUDIO REVISION ANALYZER */}
      {contract.revisionNotes && (
        <div id="revision-analyzer-card" className="bg-white border border-slate-200/95 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-2.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
              AI Revision Advisor & Delta Map
            </h4>
          </div>

          <div id="client-rationale-insight" className="p-3 bg-slate-50/80 rounded-lg text-xs border border-slate-100/90">
            <span className="text-[9px] text-slate-400 uppercase font-mono font-bold block mb-1">
              Client resubmitted with rationale (notes):
            </span>
            <p className="text-slate-700 italic font-medium leading-relaxed font-sans">
              "{contract.revisionNotes}"
            </p>
          </div>

          {loadingChanges ? (
            <div className="py-8 text-center text-xs text-slate-400 font-sans">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-indigo-500" />
              Running structural semantic line diff checks...
            </div>
          ) : revisionAnalysis ? (
            <div id="analyzer-outputs" className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">
                  Semantic Summary of Alterations
                </span>
                <p className="text-xs text-slate-800 bg-white leading-relaxed font-sans font-semibold p-3 border border-slate-100 rounded-lg">
                  {revisionAnalysis.summary}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">
                  Structural Change Delta Map
                </span>
                <div className="text-[11px] font-mono leading-relaxed bg-slate-950 text-slate-300 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap border border-slate-900 shadow-inner max-h-56">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2 text-[9px] text-slate-500 font-bold tracking-widest uppercase">
                    <span>DIFF ADVISOR TOOL</span>
                    <span>JSON STREAM</span>
                  </div>
                  {revisionAnalysis.detailedDelta}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                  Alignment Validation Rationale
                </span>
                <p className="text-xs text-slate-800 leading-relaxed bg-indigo-50/20 border-l-4 border-indigo-600 p-3 rounded-r-lg font-sans">
                  {revisionAnalysis.revisionNotesSummary}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 italic">
              Revision logs queued. Resubmit terms through 'Needs Changes' loop to populate delta views.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
