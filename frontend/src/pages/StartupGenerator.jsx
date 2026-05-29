// frontend/src/pages/StartupGenerator.jsx
// AI Startup Generator — Phase 2 of PulseOS roadmap.
// Uses your existing api.js service, Card/Button/Badge UI components,
// and matches the dark glass aesthetic of the rest of the app.

import { useState } from "react";
import api from "../services/api";

// ─── Tab config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "schema",   label: "🗄 DB Schema",       lang: "prisma" },
  { id: "api",      label: "🔌 API Routes",       lang: "js" },
  { id: "folder",   label: "📁 Folder Structure", lang: "bash" },
  { id: "frontend", label: "⚛ Frontend Plan",     lang: "md" },
  { id: "deploy",   label: "🚀 Deploy Guide",      lang: "md" },
];

const CATEGORIES = ["SaaS", "Mobile App", "Marketplace", "AI Tool", "Dev Tool", "Social", "E-commerce", "Healthcare"];

const QUICK_IDEAS = [
  "AI code review tool for dev teams",
  "Freelancer marketplace with escrow",
  "Mental health journaling with AI insights",
  "Real-time collaborative whiteboard",
];

const STEPS = ["Analyzing idea", "Designing schema", "Building API routes", "Planning frontend", "Writing deploy guide"];

// ─── Sub-components ───────────────────────────────────────────────────────────
function CodeBlock({ content, lang }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/5 bg-[#060910]">
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/60" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <span className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] text-white/20 font-mono tracking-widest uppercase">{lang}</span>
        <button
          onClick={handleCopy}
          className="text-[11px] font-mono text-white/30 hover:text-violet-400 border border-white/10 hover:border-violet-500/40 px-2 py-0.5 rounded transition-colors"
        >
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      {/* code */}
      <pre className="p-4 text-[12px] font-mono text-slate-400 whitespace-pre-wrap break-words max-h-96 overflow-y-auto leading-relaxed scrollbar-thin scrollbar-track-transparent scrollbar-thumb-violet-900/40">
        {content}
      </pre>
    </div>
  );
}

function ProgressBar({ stepIndex, loading }) {
  if (!loading) return null;
  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${
              i < stepIndex
                ? "bg-violet-500"
                : i === stepIndex
                ? "bg-gradient-to-r from-violet-500 to-emerald-500 animate-pulse"
                : "bg-white/5"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] font-mono text-violet-400">▶ {STEPS[stepIndex]}...</p>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StartupGenerator() {
  const [idea, setIdea]         = useState("");
  const [category, setCategory] = useState("SaaS");
  const [loading, setLoading]   = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [blueprint, setBlueprint] = useState(null);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState("schema");

  // Animate progress steps while loading
  function startStepAnimation() {
    setStepIndex(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= STEPS.length) { clearInterval(interval); return; }
      setStepIndex(i);
    }, 1300);
    return interval;
  }

  async function handleGenerate() {
    if (!idea.trim() || loading) return;
    setLoading(true);
    setBlueprint(null);
    setError(null);

    const interval = startStepAnimation();

    try {
      const { data } = await api.post("/startup/generate", { idea, category });
      setBlueprint(data.blueprint);
      setActiveTab("schema");
    } catch (err) {
      setError(err.response?.data?.error || "Generation failed — please try again.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  function exportMarkdown() {
    if (!blueprint) return;
    const md = `# ${blueprint.name}\n> ${blueprint.tagline}\n\n## DB Schema\n\`\`\`prisma\n${blueprint.schema}\n\`\`\`\n\n## API Routes\n\`\`\`js\n${blueprint.api}\n\`\`\`\n\n## Folder Structure\n\`\`\`\n${blueprint.folder}\n\`\`\`\n\n## Frontend Plan\n${blueprint.frontend}\n\n## Deploy Guide\n${blueprint.deploy}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    a.download = `${blueprint.name?.replace(/\s+/g, "-").toLowerCase()}-blueprint.md`;
    a.click();
  }

  function exportJSON() {
    if (!blueprint) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(blueprint, null, 2)], { type: "application/json" }));
    a.download = `${blueprint.name?.replace(/\s+/g, "-").toLowerCase()}-blueprint.json`;
    a.click();
  }

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div className="space-y-6 p-1">

      {/* ── Page Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono tracking-widest text-violet-400 uppercase">Phase 2 · PulseOS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-white">AI Startup Generator</h1>
        <p className="text-sm text-slate-500 mt-0.5">Turn any idea into a production-ready technical blueprint.</p>
      </div>

      {/* ── Input Card ── */}
      <div className="bg-[#0f1420]/80 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-sm space-y-4">

        {/* Idea input */}
        <div>
          <label className="block text-[10px] font-mono tracking-widest text-violet-400 uppercase mb-2">
            Your Idea
          </label>
          <textarea
            className="w-full min-h-[100px] bg-white/[0.03] border border-white/[0.08] rounded-xl text-slate-200 text-sm p-3 resize-none outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 placeholder:text-slate-700 transition-colors"
            placeholder="Describe your startup idea in detail. e.g. A SaaS tool that helps indie hackers track MRR, churn, and feature requests..."
            value={idea}
            onChange={e => setIdea(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleGenerate(); }}
          />
          {/* Quick examples */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[11px] text-slate-700 self-center">Try:</span>
            {QUICK_IDEAS.map(q => (
              <button
                key={q}
                onClick={() => setIdea(q)}
                className="text-[11px] text-slate-600 hover:text-violet-400 border border-white/5 hover:border-violet-500/30 px-2 py-0.5 rounded-md transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Category pills */}
        <div>
          <label className="block text-[10px] font-mono tracking-widest text-violet-400 uppercase mb-2">
            Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
                  category === c
                    ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                    : "bg-white/[0.03] border-white/[0.07] text-slate-500 hover:border-white/20 hover:text-slate-400"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !idea.trim()}
          className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="animate-pulse">⚡</span> Generating Blueprint...</>
          ) : (
            <><span>⚡</span> Generate Blueprint</>
          )}
        </button>

        <ProgressBar stepIndex={stepIndex} loading={loading} />

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-300">
            ⚠ {error}
          </div>
        )}
      </div>

      {/* ── Blueprint Results ── */}
      {blueprint && (
        <div className="space-y-4">

          {/* Result header */}
          <div className="bg-violet-500/[0.06] border border-violet-500/20 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] font-mono tracking-widest text-violet-400 uppercase mb-1">Blueprint Ready</p>
                <h2 className="text-xl font-bold text-white">{blueprint.name}</h2>
                <p className="text-sm text-slate-400 mt-0.5">{blueprint.tagline}</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                ✓ Generated
              </span>
            </div>
          </div>

          {/* Tabbed code viewer */}
          <div className="bg-[#0f1420]/80 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-sm space-y-4">

            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                    activeTab === t.id
                      ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                      : "bg-white/[0.03] border-white/[0.07] text-slate-500 hover:text-slate-400 hover:border-white/15"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Code content */}
            {currentTab && blueprint[activeTab] && (
              <CodeBlock content={blueprint[activeTab]} lang={currentTab.lang} />
            )}

            {/* Export */}
            <div className="flex gap-3 pt-2 border-t border-white/5 flex-wrap">
              <button
                onClick={exportMarkdown}
                className="flex-1 min-w-[140px] py-2 rounded-xl text-xs font-bold border border-emerald-500/25 text-emerald-400 bg-emerald-500/[0.07] hover:bg-emerald-500/15 transition-colors flex items-center justify-center gap-1.5"
              >
                ⬇ Export Markdown
              </button>
              <button
                onClick={exportJSON}
                className="flex-1 min-w-[140px] py-2 rounded-xl text-xs font-bold border border-amber-500/25 text-amber-400 bg-amber-500/[0.07] hover:bg-amber-500/15 transition-colors flex items-center justify-center gap-1.5"
              >
                ⬇ Export JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}