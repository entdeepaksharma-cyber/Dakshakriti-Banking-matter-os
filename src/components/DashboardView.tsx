import React from 'react';
import { ArrowRight, CalendarClock, FileText, FolderOpen, Scale, ShieldCheck, Sparkles } from 'lucide-react';
import type { AppDatabase, BankingMatter } from '../types.ts';

interface Props {
  db: AppDatabase;
  selectedMatter: BankingMatter;
  onSelectMatter: (matterId: string) => void;
  onNavigate: (tab: string) => void;
  onOpenNewMatter: () => void;
}

export function DashboardView({
  db,
  selectedMatter,
  onSelectMatter,
  onNavigate,
  onOpenNewMatter,
}: Props) {
  const totalMatters = db.matters.length;
  const openMatters = db.matters.filter((m) => m.status !== 'Closed').length;
  const closedMatters = db.matters.filter((m) => m.status === 'Closed').length;
  const evidenceDocs = db.matters.reduce((sum, m) => sum + m.evidence.length, 0);
  const timelineEvents = db.matters.reduce((sum, m) => sum + m.timeline.length, 0);
  const pendingComplaints = db.matters.reduce(
    (sum, m) => sum + m.complaints.filter((c) => c.status !== 'Resolved').length,
    0
  );
  const professionalReviewMatters = db.matters.filter(
    (m) => m.status === 'Professional review' || m.collaboration.invitationStatus === 'Accepted'
  ).length;

  const stats = [
    { label: 'Total Matters', value: totalMatters },
    { label: 'Open Matters', value: openMatters },
    { label: 'Closed Matters', value: closedMatters },
    { label: 'Evidence Documents', value: evidenceDocs },
    { label: 'Timeline Events', value: timelineEvents },
    { label: 'Pending Complaints', value: pendingComplaints },
    { label: 'Professional Review', value: professionalReviewMatters },
  ];

  const pendingActions = [
    ...selectedMatter.missingQuestions
      .filter((q) => q.status === 'Unanswered')
      .map((q) => ({
        id: q.questionId,
        type: 'Missing Fact / Evidence',
        title: q.question,
        meta: `${selectedMatter.matterId} · ${q.whyRelevant}`,
        actionLabel: 'Inspect Matter',
        tab: 'matters',
      })),
    ...selectedMatter.extractedFacts
      .filter((f) => f.verificationStatus === 'Pending')
      .map((f) => ({
        id: f.factId,
        type: 'Fact Verification Required',
        title: `${f.factId}: ${f.description}`,
        meta: `Source: ${f.sourceDocumentName} (${f.extractionMethod})`,
        actionLabel: 'Verify in Vault',
        tab: 'evidence',
      })),
    ...selectedMatter.consistencyAlerts
      .filter((a) => !a.resolved)
      .map((a) => ({
        id: a.alertId,
        type: `Consistency Review · ${a.issueType}`,
        title: a.message,
        meta: `${selectedMatter.matterId} · Review alert (not a finding of wrongdoing)`,
        actionLabel: 'Review Timeline',
        tab: 'timeline',
      })),
  ];

  return (
    <div className="space-y-8">
      {/* Architecture Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 lg:flex-row lg:items-center">
        <div className="max-w-2xl space-y-1.5">
          <p className="text-xs font-medium text-blue-700">
            Dakshakriti · Founded by Deepak Sharma · Banking Matter OS & Universal LLB Startup Engine
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Convert banking disputes into structured, evidence-backed legal matters
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Every matter separates customer statements, preserved original evidence, AI-extracted facts awaiting verification, date-sensitive Indian banking law sources, and independent advocate review.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('startup-engine')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-4 w-4 text-blue-700" />
            LLB Startup Engine
          </button>
          <button
            type="button"
            onClick={onOpenNewMatter}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            Register Matter
          </button>
        </div>
      </div>

      {/* 7 Dashboard KPI Metrics */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-4 lg:grid-cols-7">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-4">
            <div className="text-xs font-medium text-slate-500">{stat.label}</div>
            <div className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Two-Column Operational Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Active Matters Ledger */}
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Banking Matters Register</h2>
              <p className="text-xs text-slate-500">
                Select an active matter to inspect evidence, chronology, complaints, and legal research.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('matters')}
              className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap shrink-0"
            >
              Open All Matters
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {db.matters.map((m) => {
              const isSelected = m.matterId === selectedMatter.matterId;
              return (
                <button
                  key={m.matterId}
                  type="button"
                  onClick={() => {
                    onSelectMatter(m.matterId);
                    onNavigate('matters');
                  }}
                  className={`flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 ${
                    isSelected ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-900">{m.matterId}</span>
                      <span aria-hidden="true">·</span>
                      <span>{m.category}</span>
                      {m.isIllustrative && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-amber-700">Illustrative Case</span>
                        </>
                      )}
                    </div>
                    <div className="truncate text-sm font-medium text-slate-900">{m.title}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{m.bank.bankName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Tx {m.transaction.transactionDate}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{m.evidence.length} evidence files</span>
                      <span aria-hidden="true">·</span>
                      <span>Status: {m.status}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      ₹{m.transaction.amountInr.toLocaleString('en-IN')}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Pending Actions & Deadlines for Active Matter */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Pending Actions · {selectedMatter.matterId}
                </h2>
                <p className="text-xs text-slate-500">
                  Unanswered factual questions, unverified AI facts, and completeness checks.
                </p>
              </div>
              <CalendarClock className="h-4 w-4 text-slate-400" />
            </div>
            <div className="divide-y divide-slate-100">
              {pendingActions.length === 0 ? (
                <div className="px-5 py-6 text-sm text-slate-500">
                  No pending verification actions for {selectedMatter.matterId}.
                </div>
              ) : (
                pendingActions.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-amber-700">{item.type}</div>
                      <div className="text-sm text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.meta}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.tab)}
                      className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                    >
                      {item.actionLabel}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Module Links */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Active Matter Workflow ({selectedMatter.matterId})
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('evidence')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <FolderOpen className="h-4 w-4 text-blue-700 shrink-0" />
                <span>Evidence Vault ({selectedMatter.evidence.length})</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('complaints')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Scale className="h-4 w-4 text-blue-700 shrink-0" />
                <span>Ombudsman & Drafts</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('report')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileText className="h-4 w-4 text-blue-700 shrink-0" />
                <span>Matter Report</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('collaboration')}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <ShieldCheck className="h-4 w-4 text-blue-700 shrink-0" />
                <span>Advocate Access</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
