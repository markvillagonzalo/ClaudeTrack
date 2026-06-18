import React, { useState, useEffect } from "react";
import { 
  FileText, Calendar, Lock, Unlock, CheckCircle, 
  HelpCircle, AlertCircle, RefreshCw, Send, CheckSquare,
  Bold, Italic, Heading, List, Eraser
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Contract, ContractStatus, User } from "../types.js";

interface ContractWorkspaceProps {
  contract: Contract | null;
  currentUser: User;
  onRefresh: () => void;
  onSelectContract: (id: string | null) => void;
}

export default function ContractWorkspace({ contract, currentUser, onRefresh, onSelectContract }: ContractWorkspaceProps) {
  // Creator states (used when establishing a newly posted contract)
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  // Editing/Revision states (used during Needs Changes)
  const [revisedContent, setRevisedContent] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");

  // Review status states (used by Attorneys)
  const [selectedStatus, setSelectedStatus] = useState<ContractStatus>(ContractStatus.IN_REVIEW);
  const [attorneyRemarks, setAttorneyRemarks] = useState("");

  // Global loading states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Synchronize revisedContent whenever contract changes
  useEffect(() => {
    if (contract) {
      setRevisedContent(contract.content);
      setSelectedStatus(contract.status);
      setAttorneyRemarks(contract.attorneyReviewRemarks || "");
      setRevisionNotes("");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [contract]);

  // Handle rich-text editor utility inserts
  const insertFormatting = (tag: string) => {
    const textarea = document.getElementById("canvas-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = "";
    if (tag === "bold") {
      replacement = `**${selectedText || "bold text"}**`;
    } else if (tag === "italic") {
      replacement = `*${selectedText || "italic text"}*`;
    } else if (tag === "h1") {
      replacement = `\n# ${selectedText || "Heading 1"}\n`;
    } else if (tag === "list") {
      replacement = `\n- ${selectedText || "List item"}\n`;
    }

    if (isCreating) {
      const updated = text.substring(0, start) + replacement + text.substring(end);
      setNewContent(updated);
    } else {
      const updated = text.substring(0, start) + replacement + text.substring(end);
      setRevisedContent(updated);
    }

    // Return focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + (selectedText ? selectedText.length : 9));
    }, 50);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !newDeadline) {
      setErrorMsg("Please complete all fields (Title, Content canvas, and Requested Deadline).");
      return;
    }
    
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          requestedDeadline: newDeadline,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create contract");
      }

      const created = await response.json();
      setNewTitle("");
      setNewContent("");
      setNewDeadline("");
      setIsCreating(false);
      setSuccessMsg("Contract submitted for pipeline review!");
      onRefresh();
      onSelectContract(created.id);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisedContent.trim() || !revisionNotes.trim()) {
      setErrorMsg("Please make corrections and state your revision notes rationale (mandatory).");
      return;
    }
    if (!contract) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const response = await fetch(`/api/contracts/${contract.id}/resubmit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          content: revisedContent,
          revisionNotes,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to resubmit");
      }

      setSuccessMsg("Document revised & resubmitted back to In Review!");
      onRefresh();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttorneyReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const response = await fetch(`/api/contracts/${contract.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify({
          status: selectedStatus,
          remarks: attorneyRemarks,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to apply review");
      }

      setSuccessMsg(`Pipeline update applied successfully to '${selectedStatus}'!`);
      onRefresh();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Logic to determine editing permissions:
  // "When the contract state is marked as Needs Changes, full inline modification rights are unlocked for the client over the entire document canvas."
  // "As soon as an authorized attorney shifts a contract into the Approved status, the rich text canvas becomes structurally locked and completely immutable for all parties."
  const isEditableForClient = contract && contract.status === ContractStatus.NEEDS_CHANGES && currentUser.role === "client";
  const isApprovedAndLocked = contract && contract.status === ContractStatus.APPROVED;
  const isReadOnly = contract && (contract.status !== ContractStatus.NEEDS_CHANGES || currentUser.role !== "client");

  // Determine helper message block
  const getHelperNotice = () => {
    if (!contract) return null;
    if (isApprovedAndLocked) {
      return {
        icon: <Lock className="w-4 h-4 text-emerald-600 animate-pulse" />,
        text: "Fully Approved & Immutable. The rich text canvas is structurally locked. No further modifications can be made by any party.",
        style: "bg-emerald-50 border-emerald-100 text-emerald-800",
      };
    }
    if (contract.status === ContractStatus.SUBMITTED) {
      return {
        icon: <AlertCircle className="w-4 h-4 text-blue-600" />,
        text: "Submitted. Document is pending attorney pick-up. Canvas is locked to read-only mode to prevent version conflicts.",
        style: "bg-blue-50 border-blue-100 text-blue-800",
      };
    }
    if (contract.status === ContractStatus.IN_REVIEW) {
      return {
        icon: <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />,
        text: "In Review. Professional legal staff are actively examining the terms. Canvas is read-only.",
        style: "bg-amber-50 border-amber-100 text-amber-800",
      };
    }
    if (contract.status === ContractStatus.NEEDS_CHANGES) {
      if (currentUser.role === "client") {
        return {
          icon: <Unlock className="w-4 h-4 text-rose-600 animate-bounce" />,
          text: "Changes Requested. Full inline modification rights are unlocked over the document. Correct terms below and submit with revision notes.",
          style: "bg-rose-50 border-rose-100 text-rose-800",
        };
      } else {
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
          text: "Changes Requested. Waiting for client owner to apply modifications in the Needs Changes workspace loop.",
          style: "bg-rose-50 border-rose-100 text-rose-800",
        };
      }
    }
    return null;
  };

  const helperNotice = getHelperNotice();

  return (
    <div id="workspace-wrapper" className="space-y-6">
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 font-bold">×</button>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span className="font-medium">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800 font-bold">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. INITIAL INTAKE CREATION SCREEN */}
      {isCreating ? (
        <motion.div
          id="create-intake-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Secure In-App Contract Intake</h2>
              <p className="text-xs text-slate-500 mt-1">
                Compose or paste terms directly. External doc uploads are disabled for Version 1 strict compliance.
              </p>
            </div>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Contract Title
              </label>
              <input
                id="create-title-input"
                type="text"
                placeholder="e.g. Acme Corp Services Agreement v1"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Document Canvas (Plain or Markdown-ready)
                </label>
                
                {/* Text Formatting utility bar */}
                <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-0.5 rounded-md border border-slate-200">
                  <button type="button" onClick={() => insertFormatting("bold")} className="p-1 hover:bg-white rounded text-slate-600" title="Bold Text"><Bold className="w-3 h-3" /></button>
                  <button type="button" onClick={() => insertFormatting("italic")} className="p-1 hover:bg-white rounded text-slate-600" title="Italic Text"><Italic className="w-3 h-3" /></button>
                  <button type="button" onClick={() => insertFormatting("h1")} className="p-1 hover:bg-white rounded text-slate-600" title="Header"><Heading className="w-3 h-3" /></button>
                  <button type="button" onClick={() => insertFormatting("list")} className="p-1 hover:bg-white rounded text-slate-600" title="List"><List className="w-3 h-3" /></button>
                </div>
              </div>
              
              <textarea
                id="canvas-textarea"
                rows={12}
                placeholder="Compose, paste, or draft your contract terms explicitly within this workspace..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
                className="w-full text-sm font-mono px-3.5 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/20 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Requested Review Deadline (Mandatory)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    id="create-deadline-picker"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    required
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 cursor-pointer text-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-end justify-end">
                <button
                  id="submit-intake-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-full md:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Submitting Intake..." : "Submit to Pipeline"}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      ) : contract ? (
        /* 2. SPECIFIC CONTRACT DATA SCREEN */
        <div id="active-document-area" className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 w-full space-y-4">
            {/* Header info bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      Client: {contract.clientName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-indigo-600 rounded">
                      Tenant: {contract.tenantId}
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-slate-800 tracking-tight mt-1.5">
                    {contract.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    Deadline: <strong>{new Date(contract.requestedDeadline).toLocaleDateString()}</strong>
                  </span>
                </div>
              </div>

              {/* Status Notice Panel */}
              {helperNotice && (
                <div id="lifecycle-badge-notice" className={`p-3 border rounded-lg text-xs flex items-start gap-2.5 mb-5 ${helperNotice.style}`}>
                  <div className="mt-0.5">{helperNotice.icon}</div>
                  <p className="leading-relaxed">{helperNotice.text}</p>
                </div>
              )}

              {/* Main Document Text Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Document Canvas
                  </span>

                  {isEditableForClient && (
                    /* Editor utility options */
                    <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-0.5 rounded-md border border-slate-200">
                      <button onClick={() => insertFormatting("bold")} className="p-1 hover:bg-white rounded text-slate-600" title="Bold Text"><Bold className="w-3 h-3" /></button>
                      <button onClick={() => insertFormatting("italic")} className="p-1 hover:bg-white rounded text-slate-600" title="Italic Text"><Italic className="w-3 h-3" /></button>
                      <button onClick={() => insertFormatting("h1")} className="p-1 hover:bg-white rounded text-slate-600" title="Header"><Heading className="w-3 h-3" /></button>
                      <button onClick={() => insertFormatting("list")} className="p-1 hover:bg-white rounded text-slate-600" title="List"><List className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>

                {isReadOnly ? (
                  /* Read only canvas view */
                  <div 
                    id="readonly-canvas-output" 
                    className="w-full text-sm leading-relaxed text-slate-700 bg-slate-50/50 p-5 rounded-xl border border-slate-100 font-mono whitespace-pre-wrap max-h-[420px] overflow-y-auto"
                  >
                    {contract.content}
                  </div>
                ) : (
                  /* Editable canvas view for client in Needs Changes status */
                  <textarea
                    id="canvas-textarea"
                    rows={12}
                    value={revisedContent}
                    onChange={(e) => setRevisedContent(e.target.value)}
                    className="w-full text-sm leading-relaxed text-slate-800 bg-white p-4 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 font-mono leading-relaxed"
                  />
                )}
              </div>
            </div>

            {/* 3. ATTORNEY FEEDBACK SECTION */}
            {contract.attorneyReviewRemarks && (
              <div id="attorney-remarks-viewer" className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded bg-indigo-600 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-700 font-mono">Attorney Assessment & Remarks</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium whitespace-pre-wrap italic">
                  "{contract.attorneyReviewRemarks}"
                </p>
              </div>
            )}
            
            {/* 4. ATTORNEY CONTROL CONSOLE */}
            {currentUser.role === "attorney" && !isApprovedAndLocked && (
              <motion.div
                id="attorney-controls-section"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-indigo-100 rounded-xl p-5 shadow-sm space-y-4"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-indigo-50 pb-2">
                    Attorney Pipeline Control Console
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    State transitions must be linearly validated. Select state, optionally author notes, and apply modifications.
                  </p>
                </div>

                <form onSubmit={handleAttorneyReview} className="space-y-4">
                  <div>
                    <span className="block text-xs font-semibold text-slate-600 mb-2">Target Pipeline State</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[ContractStatus.IN_REVIEW, ContractStatus.NEEDS_CHANGES, ContractStatus.APPROVED].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setSelectedStatus(status)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                            selectedStatus === status
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Review Remarks / Changes Required (Optional for active review, helpful for Needs Changes)
                    </label>
                    <textarea
                      rows={3}
                      value={attorneyRemarks}
                      onChange={(e) => setAttorneyRemarks(e.target.value)}
                      placeholder="e.g. Please clarify compensation aggregates, and add the missing liability indemnity clauses."
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      id="apply-pipeline-btn"
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 hover:shadow-sm text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      {submitting ? "Applying pipeline shift..." : "Apply Pipeline Update"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          {/* 5. SIDEBAR SUBMISSION NOTES FOR CLIENTS ON CHANGE WORKSPACES */}
          {isEditableForClient && (
            <motion.div
              id="revision-notes-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full lg:w-80 bg-rose-50/50 ring-2 ring-rose-100 rounded-xl p-5 space-y-4"
            >
              <div>
                <h3 className="text-xs font-bold text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
                  Revision Rationale
                </h3>
                <p className="text-[11px] text-rose-600 leading-relaxed mt-1">
                  Revision notes are structurally mandatory. Explain what you corrected or amended prior to resubmission.
                </p>
              </div>

              <form onSubmit={handleResubmit} className="space-y-4">
                <div>
                  <textarea
                    rows={4}
                    required
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="e.g. Decreased commercial suite rent bounds according to Section 3. Warranty liability cap added."
                    className="w-full text-xs p-3 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-white leading-relaxed"
                  />
                </div>

                <button
                  id="resubmit-revision-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-medium text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Resubmitting..." : "Resubmit Revised Contract"}
                </button>
              </form>
            </motion.div>
          )}
        </div>
      ) : (
        /* 6. BLANK SELECTOR CARD SCREEN */
        <div id="blank-workspace" className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs mt-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-base font-semibold text-slate-700">No active document selected</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Choose a legal contract from your sidebar review list, or start a new in-app rich text intake request to begin.
          </p>
          {currentUser.role === "client" && (
            <button
              id="start-intake-btn"
              onClick={() => setIsCreating(true)}
              className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              Initiate In-App Text Intake
            </button>
          )}
        </div>
      )}
    </div>
  );
}
