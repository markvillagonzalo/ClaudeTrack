import React, { useEffect, useState } from "react";
import { Clock, User, Shield, KeySquare, FileText, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { AuditLog, Contract, User as AppUser, ContractStatus } from "../types.js";

interface ContractAuditTrailProps {
  contract: Contract;
  currentUser: AppUser;
  refreshTrigger: number;
}

export default function ContractAuditTrail({ contract, currentUser, refreshTrigger }: ContractAuditTrailProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contracts/${contract.id}/audit-trail`, {
        headers: {
          "x-user-id": currentUser.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to load audit trail", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [contract.id, currentUser, refreshTrigger]);

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case ContractStatus.SUBMITTED:
        return "bg-blue-50 text-blue-700 border-blue-100";
      case ContractStatus.IN_REVIEW:
        return "bg-amber-50 text-amber-700 border-amber-100";
      case ContractStatus.NEEDS_CHANGES:
        return "bg-rose-50 text-rose-700 border-rose-100";
      case ContractStatus.APPROVED:
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case "Create":
        return "text-blue-600 bg-blue-50/50";
      case "Status Change":
        return "text-indigo-600 bg-indigo-50/50";
      case "Edit & Resubmit":
        return "text-violet-600 bg-violet-50/50";
      case "Approve":
        return "text-emerald-600 bg-emerald-50/50";
      default:
        return "text-slate-600 bg-slate-50/50";
    }
  };

  if (loading) {
    return (
      <div id="audit-trail-loading" className="p-8 text-center text-slate-500 text-sm">
        <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
        Retreiving non-destructive audit logs...
      </div>
    );
  }

  return (
    <div id="audit-trail-container" className="space-y-6">
      <div id="trail-intro" className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            Compliance Audit Trail
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident transaction logs tracing versions, actors, hashes, and document lifecycle states.
          </p>
        </div>
        <div className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
          SECURE LOGGING ACTIVE
        </div>
      </div>

      {logs.length === 0 ? (
        <div id="empty-logs" className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-xs">No transactions recorded for this document.</p>
        </div>
      ) : (
        <div id="logs-timeline" className="relative pl-6 border-l-2 border-slate-200/60 ml-3 space-y-6 py-2">
          {logs.map((log, idx) => (
            <motion.div
              id={`audit-log-card-${log.id}`}
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative group"
            >
              {/* Timeline dot */}
              <div className="absolute -left-[31px] top-1.5 bg-slate-100 ring-4 ring-white rounded-full p-0.5 group-hover:bg-slate-200 transition-colors">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400 group-hover:bg-indigo-600 transition-colors" />
              </div>

              <div id="audit-log-inner" className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-2.5 mb-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className={`px-2 py-0.5 rounded font-medium text-[11px] ${getActionTypeColor(log.actionType)}`}>
                      {log.actionType}
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono flex items-center gap-1">
                      <KeySquare className="w-3 h-3 text-slate-400" />
                      Hash: <strong className="text-slate-600">{log.textHash}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Actor details</span>
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.actorEmail}</span>
                      <span className="text-[10px] px-1.5 py-0.1 bg-slate-100 text-slate-500 rounded font-mono uppercase">
                        {log.actorRole}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Pipeline state change</span>
                    <div className="flex items-center gap-1.5">
                      {log.fromStatus ? (
                        <>
                          <span className={`px-1.5 py-0.5 text-[10px] font-mono border rounded ${getBadgeStyle(log.fromStatus)}`}>
                            {log.fromStatus}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </>
                      ) : null}
                      <span className={`px-1.5 py-0.5 text-[10px] font-mono border rounded ${getBadgeStyle(log.toStatus)}`}>
                        {log.toStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {log.textSnapshot ? (
                  <div className="mt-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono block mb-1">Snapshot preview</span>
                    <pre className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-32 leading-relaxed border border-slate-100/80">
                      {log.textSnapshot}
                    </pre>
                  </div>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
