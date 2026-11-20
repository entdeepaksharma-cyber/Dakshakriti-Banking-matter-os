import React, { useState } from 'react';
import { Cpu, Layers, Sparkles } from 'lucide-react';
import type { AppDatabase, StartupEngineProject } from '../types.ts';

interface Props {
  db: AppDatabase;
  onGenerateStartup: (subjectName: string, syllabusInput: string) => Promise<StartupEngineProject>;
}

const PRESET_SYLLABI = [
  {
    subject: 'Consumer Law — Deficiency in E-Commerce & Digital Services',
    syllabus:
      'Consumer Protection Act, 2019: Definitions of Consumer & Deficiency, E-Commerce Rules 2020, Dark Patterns Guidelines, Pecuniary Jurisdiction of District/State/National Commissions, Mediation & Product Liability.',
  },
  {
    subject: 'Property Law — Transfer of Property, Mortgage & RERA Delays',
    syllabus:
      'Transfer of Property Act, 1882 & Real Estate (Regulation and Development) Act, 2016: Builder Delay Remedies, Allotment Agreements, Escrow Compliance, Mortgage Redemption & Encumbrance Verification.',
  },
  {
    subject: 'Company Law — Oppression, Mismanagement & Board Compliance',
    syllabus:
      'Companies Act, 2013: Duties of Directors (s.166), Related Party Transactions (s.188), Minority Shareholder Protection against Oppression & Mismanagement (ss.241–242), NCLT Filing Chronologies.',
  },
];

export function StartupEngineView({ db, onGenerateStartup }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState(db.startupProjects[0]?.projectId || '');
  const [subjectName, setSubjectName] = useState('');
  const [syllabusInput, setSyllabusInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const activeProject =
    db.startupProjects.find((p) => p.projectId === selectedProjectId) || db.startupProjects[0];

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!syllabusInput.trim()) {
      setError('Enter or select an LLB syllabus topic to generate a legal startup blueprint.');
      return;
    }
    setError('');
    setGenerating(true);
    try {
      const created = await onGenerateStartup(subjectName || 'Custom LLB Subject', syllabusInput);
      setSelectedProjectId(created.projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* V2.0 Parent Engine Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="max-w-3xl space-y-1">
            <div className="text-xs font-medium text-blue-700">
              Dakshakriti V2.0 Parent Architecture · Universal LLB Startup Engine
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Convert Any LLB Syllabus into Verified Research, Scored Startups & Matter Software
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              Banking Matter OS is Product #1 generated from this engine. Paste any LLB syllabus unit below to run the 6-stage pipeline: Syllabus Parsing → Legal Research Card → Problem Discovery → 100-Point Opportunity Scoring → Product Modules → Indian Compliance Structure.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <Layers className="h-4 w-4 text-blue-700" />
            <span>{db.startupProjects.length} Generated Blueprint(s)</span>
          </div>
        </div>
      </div>

      {/* Syllabus Input & Presets */}
      <form onSubmit={handleGenerate} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Import LLB Syllabus & Run 6-Stage Transformation
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_SYLLABI.map((preset) => (
              <button
                key={preset.subject}
                type="button"
                onClick={() => {
                  setSubjectName(preset.subject);
                  setSyllabusInput(preset.syllabus);
                }}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                Load: {preset.subject.split('—')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">LLB Subject / Topic</label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g., Contract Law — Breach & Liquidated Damages"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Syllabus Units & Statutory Scope
            </label>
            <textarea
              rows={2}
              value={syllabusInput}
              onChange={(e) => setSyllabusInput(e.target.value)}
              placeholder="Paste LLB syllabus text, acts, rules, and real-world scope..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Cpu className="h-4 w-4" />
            {generating ? 'Running Gemini Startup Engine...' : 'Generate Legal Research & Startup Blueprint'}
          </button>
        </div>
      </form>

      {/* Blueprint Switcher */}
      <div className="flex flex-wrap gap-2">
        {db.startupProjects.map((p) => (
          <button
            key={p.projectId}
            type="button"
            onClick={() => setSelectedProjectId(p.projectId)}
            className={`rounded-lg border px-3.5 py-2 text-left text-xs transition-colors ${
              activeProject?.projectId === p.projectId
                ? 'border-blue-700 bg-blue-50 text-blue-950 font-semibold'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="font-mono text-[11px] text-slate-500">
              {p.projectId} · Score {p.opportunity.totalScore}/100
            </div>
            <div>{p.opportunity.productName}</div>
          </button>
        ))}
      </div>

      {/* Active Blueprint Detail */}
      {activeProject && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Opportunity & Scoring Matrix */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="text-xs font-medium text-blue-700">
                    {activeProject.subjectName}
                  </div>
                  <h3 className="mt-0.5 flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Sparkles className="h-4 w-4 text-blue-700" />
                    {activeProject.opportunity.productName}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Opportunity Score</div>
                  <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {activeProject.opportunity.totalScore}/100
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div><strong>Business Model:</strong> {activeProject.opportunity.businessModel}</div>
                <div><strong>Pricing Hypothesis:</strong> {activeProject.opportunity.pricingHypothesis}</div>
                <div><strong>Verdict:</strong> {activeProject.opportunity.viabilityVerdict}</div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2 pr-3 font-medium">Scoring Factor</th>
                      <th className="pb-2 pr-3 text-right font-medium">Score / Weight</th>
                      <th className="pb-2 font-medium">Hypothesis Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeProject.opportunity.scoreBreakdown.map((row) => (
                      <tr key={row.factor}>
                        <td className="py-2 pr-3 font-medium text-slate-900">{row.factor}</td>
                        <td className="py-2 pr-3 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                          {row.score} / {row.weight}
                        </td>
                        <td className="py-2 text-slate-600">{row.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Universal Legal Research Card + Problem Discovery */}
            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs">
                <div className="font-mono font-semibold text-blue-700">
                  {activeProject.researchCard.researchCardId}
                </div>
                <h4 className="mt-1 text-sm font-semibold text-slate-900">
                  {activeProject.researchCard.legalIssue}
                </h4>
                <div className="mt-2 space-y-1 text-slate-600">
                  <div><strong>Governing Law:</strong> {activeProject.researchCard.governingLaw}</div>
                  <div><strong>Provisions:</strong> {activeProject.researchCard.relevantProvisions}</div>
                  <div><strong>Notifications/Rules:</strong> {activeProject.researchCard.rulesAndNotifications}</div>
                  <div><strong>Procedure:</strong> {activeProject.researchCard.procedure}</div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs">
                <h4 className="text-sm font-semibold text-slate-900">Real-World Problem Discovery</h4>
                <div className="mt-2 space-y-2 text-slate-600">
                  <div><strong>Actors:</strong> {activeProject.problemDiscovery.actors.join(', ')}</div>
                  <div><strong>Target Customers:</strong> {activeProject.problemDiscovery.targetCustomers.join(', ')}</div>
                  <div>
                    <strong>Recurring Problems:</strong>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {activeProject.problemDiscovery.recurringProblems.map((prob, idx) => (
                        <li key={idx}>{prob}</li>
                      ))}
                    </ul>
                  </div>
                  <div><strong>Solution Gap:</strong> {activeProject.problemDiscovery.existingSolutionsGap}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Spec & Indian Compliance Plan */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs">
              <h4 className="text-sm font-semibold text-slate-900">
                Configurable Product Modules & Data Entities
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-700">
                {activeProject.productSpec.coreModules.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
              <div className="mt-3 text-slate-500">
                <strong>Database Entities:</strong>{' '}
                <span className="font-mono text-slate-800">
                  {activeProject.productSpec.dataEntities.join(', ')}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs">
              <h4 className="text-sm font-semibold text-slate-900">
                Indian Legal & Regulatory Compliance Structure
              </h4>
              <div className="mt-2 space-y-1.5 text-slate-700">
                <div><strong>BCI Rule 36:</strong> {activeProject.legalCompliancePlan.bciRule36Compliance}</div>
                <div><strong>DPDP Act 2023 / Rules 2025:</strong> {activeProject.legalCompliancePlan.dpdpCompliance}</div>
                <div>
                  <strong>Key Risks:</strong> {activeProject.legalCompliancePlan.regulatoryRisks.join(' · ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
