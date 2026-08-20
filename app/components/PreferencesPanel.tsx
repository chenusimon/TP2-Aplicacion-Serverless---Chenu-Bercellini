import { useState } from "react";

const behaviorOptions = [
  { value: "supportive", label: "Supportive", description: "Patient and encouraging" },
  { value: "balanced", label: "Balanced", description: "Honest and constructive" },
  { value: "unforgiving", label: "Unforgiving", description: "Strict and highly critical" },
] as const;

const identityPresets = [
  "Fashion professional",
  "Senior software engineer",
  "Academic tutor",
  "Business strategist",
];

const styleOptions = ["Conversational", "Professional", "Direct"] as const;

export function PreferencesPanel() {
  const [behavior, setBehavior] = useState("balanced");
  const [identity, setIdentity] = useState("Work like a professional in the fashion industry with strong knowledge of trends, styling, branding, and production.");
  const [responseStyle, setResponseStyle] = useState("Professional");
  const [detailLevel, setDetailLevel] = useState(2);
  const [acknowledgeUncertainty, setAcknowledgeUncertainty] = useState(true);

  function applyIdentityPreset(preset: string) {
    const identities: Record<string, string> = {
      "Fashion professional": "Work like a professional in the fashion industry with strong knowledge of trends, styling, branding, and production.",
      "Senior software engineer": "Work like a senior software engineer who prioritizes maintainability, security, and clear technical explanations.",
      "Academic tutor": "Work like a patient academic tutor who teaches concepts step by step and checks for understanding.",
      "Business strategist": "Work like an experienced business strategist focused on practical decisions, tradeoffs, and measurable outcomes.",
    };
    setIdentity(identities[preset]);
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-9">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-app-muted">Personalization</p>
            <span className="rounded-full border border-app-line bg-app-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-app-subtle">UI preview</span>
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">AI Preferences</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-app-muted">Shape the personality, expertise, and response style you would like Askly to use.</p>
        </div>

        <div className="space-y-5">
          <PreferenceCard title="Behavior" description="Choose how Askly should evaluate your ideas and work.">
            <div className="grid gap-2 sm:grid-cols-3">
              {behaviorOptions.map((option) => (
                <button key={option.value} type="button" onClick={() => setBehavior(option.value)} aria-pressed={behavior === option.value} className={`rounded-xl border p-3 text-left transition-colors ${behavior === option.value ? "border-app-foreground bg-app-active" : "border-app-line hover:bg-app-hover"}`}>
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-app-muted">{option.description}</span>
                </button>
              ))}
            </div>
          </PreferenceCard>

          <PreferenceCard title="Identity and expertise" description="Describe the role and professional perspective Askly should adopt.">
            <div className="mb-3 flex flex-wrap gap-2">
              {identityPresets.map((preset) => (
                <button key={preset} type="button" onClick={() => applyIdentityPreset(preset)} className="rounded-full border border-app-line px-3 py-1.5 text-xs text-app-muted hover:bg-app-hover hover:text-app-foreground">{preset}</button>
              ))}
            </div>
            <textarea aria-label="AI identity and expertise" value={identity} onChange={(event) => setIdentity(event.target.value)} rows={4} maxLength={500} className="w-full resize-y rounded-xl border border-app-line bg-app-background px-4 py-3 text-sm leading-6 outline-none focus:border-app-subtle" />
            <p className="mt-1.5 text-right text-[11px] text-app-subtle">{identity.length}/500</p>
          </PreferenceCard>


          <PreferenceCard title="Level of detail" description="Control how concise or thorough responses should feel.">
            <input aria-label="Response detail level" type="range" min="1" max="3" step="1" value={detailLevel} onChange={(event) => setDetailLevel(Number(event.target.value))} className="w-full accent-app-foreground" />
            <div className="mt-2 flex justify-between text-xs text-app-muted"><span>Concise</span><span>Balanced</span><span>Thorough</span></div>
          </PreferenceCard>

          <PreferenceCard title="Accuracy and uncertainty" description="Ask the AI to be transparent when information may be incomplete.">
            <div className="flex items-center justify-between gap-5">
              <div><p className="text-sm font-medium">Acknowledge uncertainty</p><p className="mt-1 text-xs leading-5 text-app-muted">Clearly distinguish facts, assumptions, and uncertain claims.</p></div>
              <button type="button" onClick={() => setAcknowledgeUncertainty((enabled) => !enabled)} aria-label="Toggle uncertainty acknowledgements" aria-pressed={acknowledgeUncertainty} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${acknowledgeUncertainty ? "bg-app-foreground" : "bg-app-active"}`}><span className={`absolute top-1 size-5 rounded-full bg-app-surface shadow-sm ${acknowledgeUncertainty ? "right-1" : "left-1"}`} /></button>
            </div>
          </PreferenceCard>
        </div>

      </div>
    </div>
  );
}

function PreferenceCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-app-line bg-app-surface px-5 py-5 shadow-sm sm:px-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-app-muted">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
