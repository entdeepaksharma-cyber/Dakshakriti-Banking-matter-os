import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Cpu, Edit3, ExternalLink, Search } from 'lucide-react';
import {
  BANKING_PROBLEM_CATEGORIES,
  LEGAL_CLASSIFICATION_CATEGORIES,
  evaluateDateSensitiveRules,
} from '../data/seedData.ts';
import type {
  AppDatabase,
  BankingMatter,
  LegalClassificationCategory,
  MatterStatus,
} from '../types.ts';

interface Props {
  db: AppDatabase;
  selectedMatter: BankingMatter;
  onSelectMatter: (matterId: string) => void;
  onOpenNewMatter: () => void;
  onAnalyzeMatter: (matterId: string) => Promise<void>;
  onUpdateStatus: (matterId: string, status: MatterStatus) => Promise<void>;
  onOverrideIssue: (
    matterId: string,
    issueId: string,
    classification: LegalClassificationCategory,
    reason: string
  ) => Promise<void>;
  onNavigate: (tab: string) => void;
}

export function MattersView({
  db,
  selectedMatter,
  onSelectMatter,
  onOpenNewMatter,
  onAnalyzeMatter,
  onUpdateStatus,
  onOverrideIssue,
  onNavigate,
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');

  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [overrideClass, setOverrideClass] = useState<LegalClassificationCategory>('RBI regulatory issue');
  const [overrideReason, setOverrideReason] = useState('');

  const filteredMatters = db.matters.filter((m) => {
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      m.matterId.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.bank.bankName.toLowerCase().includes(q) ||
      m.customer.name.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const dateRules = evaluateDateSensitiveRules(
    selectedMatter.transaction.transactionDate,
    selectedMatter.bank.bankCategory
  );

  async function handleRunAi() {
    setAiError('');
    setAnalyzing(true);
    try {
      await onAnalyzeMatter(selectedMatter.matterId);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter & Matter Switcher Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Matter ID, customer, bank, or category..."
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {['All', 'Open', 'Complaint filed', 'Professional review', 'Closed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenNewMatter}
          className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          New Banking Matter
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Matter List Sidebar */}
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-4">
          <div className="border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700">
            Matters ({filteredMatters.length})
          </div>
          <div className="divide-y divide-slate-100">
            {filteredMatters.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No matters match this filter.
              </div>
            ) : (
              filteredMatters.map((m) => (
                <button
                  key={m.matterId}
                  type="button"
                  onClick={() => onSelectMatter(m.matterId)}
                  className={`block w-full px-4 py-3.5 text-left transition-colors hover:bg-slate-50 ${
                    m.matterId === selectedMatter.matterId ? 'bg-blue-50/60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-900">{m.matterId}</span>
                    <span className="font-mono tabular-nums">
                      ₹{m.transaction.amountInr.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">
                    {m.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {m.bank.bankName} · {m.status}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Matter Details Main Workspace (4-Section Structure) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Header & Status Control */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-slate-900">
                    {selectedMatter.matterId}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedMatter.category}</span>
                  {selectedMatter.isIllustrative && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-amber-700">
                        ILLUSTRATIVE MATTER — NOT AN ACTUAL CUSTOMER CASE
                      </span>
                    </>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-slate-900">{selectedMatter.title}</h2>
                <p className="text-xs text-slate-500">
                  Customer: {selectedMatter.customer.name} ({selectedMatter.customer.customerType}) · Bank: {selectedMatter.bank.bankName} ({selectedMatter.bank.bankCategory}) · A/c: <span className="font-mono">{selectedMatter.bank.accountReference}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  value={selectedMatter.status}
                  onChange={(e) =>
                    onUpdateStatus(selectedMatter.matterId, e.target.value as MatterStatus)
                  }
                  aria-label="Matter status"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Open">Open</option>
                  <option value="Under review">Under review</option>
                  <option value="Complaint filed">Complaint filed</option>
                  <option value="Professional review">Professional review</option>
                  <option value="Closed">Closed</option>
                </select>
                <button
                  type="button"
                  onClick={handleRunAi}
                  disabled={analyzing}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-60 whitespace-nowrap"
                >
                  <Cpu className="h-3.5 w-3.5" />
                  {analyzing ? 'Analysing Matter...' : 'Run V1.5 AI Legal Analysis'}
                </button>
              </div>
            </div>

            {aiError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {aiError}
              </div>
            )}

            {/* Core Transaction & Problem Summary */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
              <div>
                <div className="text-slate-500">Transaction Date</div>
                <div className="mt-0.5 font-mono font-medium text-slate-900 tabular-nums">
                  {selectedMatter.transaction.transactionDate}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Disputed Amount</div>
                <div className="mt-0.5 font-mono font-semibold text-slate-900 tabular-nums">
                  ₹{selectedMatter.transaction.amountInr.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Reference / UTR</div>
                <div className="mt-0.5 font-mono text-slate-900">
                  {selectedMatter.transaction.transactionReference || 'Not recorded'}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Discovered Date</div>
                <div className="mt-0.5 font-mono text-slate-900 tabular-nums">
                  {selectedMatter.problem.discoveredDate}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 text-sm md:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-slate-500">Customer Narrative (User-Provided Statement)</div>
                <p className="mt-1 text-slate-700">{selectedMatter.problem.whatHappened}</p>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Expected vs Actual Outcome</div>
                <p className="mt-1 text-slate-700">
                  <span className="font-medium">Expected:</span> {selectedMatter.problem.customerExpected || 'N/A'}
                  <br />
                  <span className="font-medium">Actual:</span> {selectedMatter.problem.whatActuallyHappened || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION A: Established Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  A. Established Information (Document-Supported Facts)
                </h3>
                <p className="text-xs text-slate-500">
                  Facts confirmed against uploaded documents. Unverified AI extractions remain flagged separately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('evidence')}
                className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap"
              >
                Verify Facts in Vault
              </button>
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              {selectedMatter.extractedFacts.length === 0 ? (
                <p className="py-3 text-sm text-slate-500">
                  No extracted or verified facts yet. Upload evidence in the Evidence Vault.
                </p>
              ) : (
                selectedMatter.extractedFacts.map((fact) => (
                  <div key={fact.factId} className="flex items-start justify-between gap-4 py-3 text-sm">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-800">{fact.factId}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{fact.date}</span>
                        <span>·</span>
                        <span>Source: {fact.sourceDocumentName} ({fact.pageOrReference})</span>
                      </div>
                      <div className="text-slate-900">{fact.description}</div>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <span
                        className={`font-medium ${
                          fact.verificationStatus === 'Verified'
                            ? 'text-emerald-700'
                            : fact.verificationStatus === 'Disputed'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {fact.verificationStatus === 'Verified'
                          ? 'Document Supported'
                          : fact.verificationStatus === 'Disputed'
                          ? 'Disputed by User'
                          : 'Pending Verification'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION B: Potential Legal Issues */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                B. Potential Legal Issues (Preliminary Classification Only)
              </h3>
              <p className="text-xs text-slate-500">
                Preliminary banking-law issues for assessment. Not a binding judicial conclusion or automatic entitlement to refund.
              </p>
            </div>

            <div className="mt-4 space-y-4">
              {selectedMatter.legalIssues.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Run V1.5 AI Legal Analysis above to classify preliminary legal issues grounded to verified Indian banking law sources.
                </p>
              ) : (
                selectedMatter.legalIssues.map((issue) => (
                  <div key={issue.issueId} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-semibold text-slate-900">{issue.issueId}</span>
                          <span>·</span>
                          <span className="font-medium text-blue-700">{issue.classification}</span>
                          <span>·</span>
                          <span>{issue.isPrimary ? 'Primary Issue' : 'Secondary Issue'}</span>
                          <span>·</span>
                          <span className="font-medium text-amber-700">{issue.statusLabel}</span>
                        </div>
                        <h4 className="mt-1 text-sm font-semibold text-slate-900">{issue.title}</h4>
                        <p className="mt-1 text-sm text-slate-600">{issue.preliminarySummary}</p>
                        {issue.userOverrideReason && (
                          <p className="mt-1 text-xs text-slate-500">
                            User adjustment note: {issue.userOverrideReason}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>Linked Verified Sources:</span>
                          {issue.linkedSourceIds.map((sid) => (
                            <span key={sid} className="font-mono text-slate-800">
                              {sid}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIssueId(issue.issueId);
                          setOverrideClass(issue.classification);
                          setOverrideReason(issue.userOverrideReason || '');
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0"
                      >
                        <Edit3 className="h-3 w-3" /> Adjust
                      </button>
                    </div>

                    {editingIssueId === issue.issueId && (
                      <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
                        <div className="min-w-[200px] flex-1">
                          <label className="mb-1 block text-xs font-medium text-slate-700">
                            Reclassify Issue
                          </label>
                          <select
                            value={overrideClass}
                            onChange={(e) =>
                              setOverrideClass(e.target.value as LegalClassificationCategory)
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                          >
                            {LEGAL_CLASSIFICATION_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="min-w-[220px] flex-1">
                          <label className="mb-1 block text-xs font-medium text-slate-700">
                            Reason for Change
                          </label>
                          <input
                            type="text"
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="Record why classification was changed..."
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await onOverrideIssue(
                              selectedMatter.matterId,
                              issue.issueId,
                              overrideClass,
                              overrideReason
                            );
                            setEditingIssueId(null);
                          }}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIssueId(null)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION C: Applicable Legal Material (Date-Sensitive Retrieval) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  C. Applicable Legal Material (Date-Sensitive Selection)
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluated strictly against Transaction Date ({selectedMatter.transaction.transactionDate}) and Entity Category ({selectedMatter.bank.bankCategory}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('legal-sources')}
                className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap"
              >
                Open Verified Library
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono font-semibold text-slate-900">
                    {dateRules.applicableLiabilityRule.sourceId}
                  </span>
                  <span className="font-medium text-emerald-700">Source Verified · Applicable Rule Set</span>
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {dateRules.applicableLiabilityRule.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {dateRules.applicableLiabilityRule.reason}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono font-semibold text-slate-900">
                    {dateRules.ombudsmanScheme.sourceId}
                  </span>
                  <span
                    className={`font-medium ${
                      dateRules.ombudsmanScheme.isCoveredEntity ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {dateRules.ombudsmanScheme.isCoveredEntity ? 'Entity Category Covered' : 'Coverage Warning'}
                  </span>
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {dateRules.ombudsmanScheme.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {dateRules.ombudsmanScheme.note}
                </p>
              </div>
            </div>
          </div>

          {/* Legal Issue-to-Evidence Matrix */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-base font-semibold text-slate-900">Legal Issue-to-Evidence Matrix</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Maps every factual & legal question to required documentary records.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 pr-4 font-medium">Legal Question</th>
                    <th className="pb-2 pr-4 font-medium">Relevant Evidence</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedMatter.issueEvidenceMatrix.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 pr-4 font-medium text-slate-900">{row.legalQuestion}</td>
                      <td className="py-2.5 pr-4 text-slate-600">{row.relevantEvidenceRequired}</td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            row.status === 'Available'
                              ? 'text-emerald-700'
                              : row.status === 'Partial'
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {row.status === 'Available' ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          )}
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION D: Professional Assessment */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  D. Professional Assessment (Independent Lawyer Review)
                </h3>
                <p className="text-xs text-slate-500">
                  Qualified advocate independently determines applicable law, strategy, and remedy.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('collaboration')}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline whitespace-nowrap"
              >
                Open Review Workspace <ExternalLink className="h-3 w-3" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {selectedMatter.collaboration.professionalNotes.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No independent advocate assessment recorded yet. Invite an advocate in Professional Review.
                </p>
              ) : (
                selectedMatter.collaboration.professionalNotes.map((note) => (
                  <div key={note.noteId} className="rounded-lg border border-slate-200 p-4 text-sm">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-slate-900">
                        {note.authorName} · Bar ID {note.authorBarId}
                      </span>
                      <span className="font-mono">{note.createdAt}</span>
                    </div>
                    <div className="mt-1 text-xs font-medium text-blue-700">{note.category}</div>
                    <p className="mt-1 text-slate-700">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
