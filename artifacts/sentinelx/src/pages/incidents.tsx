import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useListIncidents,
  getListIncidentsQueryKey,
  useCreateIncident,
  useGetIncident,
  getGetIncidentQueryKey,
  useUpdateIncident,
  useGetIncidentTimeline,
  getGetIncidentTimelineQueryKey,
  useRunIncidentPlaybook,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus, ChevronRight, Clock, Shield, CheckCircle, XCircle, FileText, Play } from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-400/10 border-red-400/30",
  high: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  low: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

const STATUS_COLORS: Record<string, string> = {
  open: "text-red-400 bg-red-400/10",
  investigating: "text-yellow-400 bg-yellow-400/10",
  contained: "text-cyan-400 bg-cyan-400/10",
  resolved: "text-green-400 bg-green-400/10",
};

const STATUS_ICONS: Record<string, typeof AlertTriangle> = {
  open: AlertTriangle,
  investigating: Clock,
  contained: Shield,
  resolved: CheckCircle,
};

const TIMELINE_TYPE_COLORS: Record<string, string> = {
  detection: "text-red-400",
  escalation: "text-orange-400",
  investigation: "text-yellow-400",
  response: "text-cyan-400",
  containment: "text-blue-400",
  resolution: "text-green-400",
};

function CreateIncidentModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("high");
  const [description, setDescription] = useState("");
  const qc = useQueryClient();
  const create = useCreateIncident({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListIncidentsQueryKey() }); onClose(); },
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Plus size={18} className="text-cyan-400" /> Create Incident</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Title</label>
            <input data-testid="input-incident-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Incident title..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Severity</label>
            <select data-testid="select-incident-severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Description</label>
            <textarea data-testid="input-incident-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the incident..." rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button data-testid="button-cancel-incident" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button data-testid="button-create-incident" onClick={() => create.mutate({ data: { title, severity, description } })} disabled={!title || !description || create.isPending} className="px-4 py-2 text-sm bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30 disabled:opacity-50 transition-all">
            {create.isPending ? "Creating..." : "Create Incident"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function IncidentDetail({ id }: { id: number }) {
  const { data: incident } = useGetIncident(id, { query: { queryKey: getGetIncidentQueryKey(id) } });
  const { data: timeline } = useGetIncidentTimeline(id, { query: { queryKey: getGetIncidentTimelineQueryKey(id) } });
  const [playbookType, setPlaybookType] = useState("containment");
  const qc = useQueryClient();
  const update = useUpdateIncident({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetIncidentQueryKey(id) }); qc.invalidateQueries({ queryKey: getListIncidentsQueryKey() }); } } });
  const playbook = useRunIncidentPlaybook({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetIncidentTimelineQueryKey(id) }) } });

  if (!incident) return <div className="p-6 text-slate-500 text-sm">Loading...</div>;

  const inc = incident;
  const StatusIcon = STATUS_ICONS[inc.status] ?? AlertTriangle;

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-white">{inc.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{new Date(inc.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium border ${SEVERITY_COLORS[inc.severity] ?? ""}`}>{inc.severity.toUpperCase()}</span>
            <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${STATUS_COLORS[inc.status] ?? ""}`}>
              <StatusIcon size={10} />{inc.status}
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-300">{inc.description}</p>
        {(inc.affectedAssets as string[]).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {(inc.affectedAssets as string[]).map((a: string) => (
              <span key={a} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded">{a}</span>
            ))}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          {["investigating", "contained", "resolved"].map((s) => (
            <button data-testid={`button-status-${s}`} key={s} onClick={() => update.mutate({ id, data: { status: s } })} disabled={inc.status === s || update.isPending} className={`px-3 py-1 text-xs rounded border transition-all disabled:opacity-30 ${inc.status === s ? "border-cyan-500/50 text-cyan-400 bg-cyan-500/10" : "border-slate-600 text-slate-400 hover:border-slate-400"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2"><Play size={14} className="text-cyan-400" /> Run Playbook</h4>
          <div className="flex gap-2">
            <select data-testid="select-playbook-type" value={playbookType} onChange={(e) => setPlaybookType(e.target.value)} className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 focus:border-cyan-500 focus:outline-none">
              <option value="containment">Containment</option>
              <option value="eradication">Eradication</option>
              <option value="recovery">Recovery</option>
              <option value="forensics">Forensics</option>
            </select>
            <button data-testid="button-run-playbook" onClick={() => playbook.mutate({ id, data: { playbookType } })} disabled={playbook.isPending} className="px-3 py-1 text-xs bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded hover:bg-cyan-500/30 disabled:opacity-50 transition-all">
              {playbook.isPending ? "Running..." : "Execute"}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-4">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3"><Clock size={14} className="text-cyan-400" /> Timeline</h4>
        <div className="space-y-3">
          {(timeline ?? []).map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-1 ${TIMELINE_TYPE_COLORS[event.type] ? "bg-current" : "bg-slate-600"} ${TIMELINE_TYPE_COLORS[event.type] ?? ""}`} />
                {i < (timeline ?? []).length - 1 && <div className="w-px flex-1 bg-slate-700 mt-1" />}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-medium ${TIMELINE_TYPE_COLORS[event.type] ?? "text-slate-400"}`}>{event.type}</span>
                  <span className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-slate-300">{event.description}</p>
                <p className="text-xs text-slate-500">by {event.actor}</p>
              </div>
            </motion.div>
          ))}
          {(timeline ?? []).length === 0 && <p className="text-xs text-slate-500 text-center py-4">No timeline events yet</p>}
        </div>
      </div>
    </div>
  );
}

export default function Incidents() {
  const { data: incidents } = useListIncidents();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText size={20} className="text-cyan-400" />
            Incident Response Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Active cases and response workflows</p>
        </div>
        <button data-testid="button-new-incident" onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all text-sm">
          <Plus size={16} /> New Incident
        </button>
      </div>

      {showCreate && <CreateIncidentModal onClose={() => setShowCreate(false)} />}

      <div className="flex-1 grid grid-cols-5 gap-4 min-h-0">
        <div className="col-span-2 glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Incidents</span>
            <span className="text-xs text-slate-500">{(incidents ?? []).length} total</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {(incidents ?? []).map((inc, i) => {
                const StatusIcon = STATUS_ICONS[inc.status] ?? AlertTriangle;
                return (
                  <motion.div
                    key={inc.id}
                    data-testid={`row-incident-${inc.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedId(inc.id)}
                    className={`p-3 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${selectedId === inc.id ? "bg-cyan-500/5 border-l-2 border-l-cyan-500" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-white truncate flex-1 mr-2">{inc.title}</p>
                      <ChevronRight size={14} className="text-slate-600 flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded border ${SEVERITY_COLORS[inc.severity] ?? ""}`}>{inc.severity}</span>
                      <span className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded ${STATUS_COLORS[inc.status] ?? ""}`}>
                        <StatusIcon size={10} />{inc.status}
                      </span>
                      <span className="text-xs text-slate-500 ml-auto">{new Date(inc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {(incidents ?? []).length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                <CheckCircle size={24} className="mb-2 opacity-40" />
                <p className="text-xs">No active incidents</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3 overflow-y-auto">
          {selectedId ? (
            <IncidentDetail id={selectedId} />
          ) : (
            <div className="h-full glass-panel rounded-xl flex flex-col items-center justify-center text-slate-500">
              <FileText size={32} className="mb-3 opacity-30" />
              <p className="text-sm">Select an incident to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
