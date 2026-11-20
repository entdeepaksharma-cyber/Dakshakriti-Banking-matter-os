import React, { useState } from 'react';
import { BookOpen, CalendarSearch, ExternalLink, Gavel, Search } from 'lucide-react';
import { BANK_CATEGORIES, evaluateDateSensitiveRules } from '../data/seedData.ts';
import type { AppDatabase, BankCategory } from '../types.ts';

interface Props {
  db: AppDatabase;
}

export function LegalSourcesView({ db }: Props) {
  const [query, setQuery] = useState('');
  const [simDate, setSimDate] = useState('2026-11-10');
  const [simBankCat, setSimBankCat] = useState<BankCategory>('Commercial Bank');

  const simResult = evaluateDateSensitiveRules(simDate, simBankCat);

  const filteredSources = db.legalSources.filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      s.sourceId.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.sourceType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Date-Sensitive Rule Applicability Simulator */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <CalendarSearch className="h-4 w-4 text-blue-700" />
              Date-Sensitive Legal Applicability Simulator (Source-First Engine)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Verifies which RBI rules and Ombudsman Scheme govern a dispute based strictly on transaction date and regulated-entity category. Never applies 1 Jan 2027 rules retroactively.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="space-y-3 md:col-span-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Test Transaction Date
              </label>
              <input
                type="date"
                value={simDate}
                onChange={(e) => setSimDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Regulated Entity Category
              </label>
              <select
                value={simBankCat}
                onChange={(e) => setSimBankCat(e.target.value as BankCategory)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                {BANK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:col-span-8 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
              <div className="font-mono font-semibold text-blue-700">
                {simResult.applicableLiabilityRule.sourceId}
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {simResult.applicableLiabilityRule.title}
              </div>
              <p className="mt-1.5 leading-relaxed text-slate-600">
                {simResult.applicableLiabilityRule.reason}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
              <div className="font-mono font-semibold text-blue-700">
                {simResult.ombudsmanScheme.sourceId}
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {simResult.ombudsmanScheme.title}
              </div>
              <p className="mt-1.5 leading-relaxed text-slate-600">
                {simResult.ombudsmanScheme.note}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Legal-Source Register */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <BookOpen className="h-4 w-4 text-blue-700" />
              Verified Indian Banking Law Source Register ({filteredSources.length})
            </h3>
            <p className="text-xs text-slate-500">
              Primary legislation from India Code and regulatory circulars/schemes from Reserve Bank of India with commencement & supersession tracking.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter acts, circulars, dates..."
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredSources.map((src) => (
            <div key={src.sourceId} className="space-y-1.5 px-6 py-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-slate-500">
                  <span className="font-mono font-semibold text-slate-900">{src.sourceId}</span>
                  <span>·</span>
                  <span>{src.sourceType}</span>
                  <span>·</span>
                  <span>{src.issuingAuthority}</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">
                    Commenced: {src.commencementDate}
                  </span>
                  {src.effectiveUntil && (
                    <>
                      <span>·</span>
                      <span className="font-mono tabular-nums">Until: {src.effectiveUntil}</span>
                    </>
                  )}
                </div>
                <span
                  className={`font-semibold ${
                    src.verificationStatus === 'Verified'
                      ? 'text-emerald-700'
                      : src.verificationStatus === 'Outdated'
                      ? 'text-red-700'
                      : 'text-amber-700'
                  }`}
                >
                  {src.verificationStatus}
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-900">{src.title}</div>
              <div className="text-slate-700">{src.summary}</div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                <span>
                  Sections/Paras: <span className="font-medium text-slate-700">{src.sectionOrParagraph}</span> · Amendment History: {src.amendmentHistory}
                </span>
                <a
                  href={src.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline whitespace-nowrap"
                >
                  Official Source <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Universal Legal Research Cards */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900">
          Universal Legal Research Cards ({db.researchCards.length})
        </h3>
        <p className="text-xs text-slate-500">
          Reusable LLB syllabus-linked templates bridging academic legal knowledge directly into live matter workflows.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {db.researchCards.map((card) => (
            <div key={card.researchCardId} className="rounded-lg border border-slate-200 p-4 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-mono font-semibold text-slate-900">
                  {card.researchCardId}
                </span>
                <span
                  className={`font-semibold ${
                    card.currentStatus === 'Verified' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {card.currentStatus} · {card.verificationDate}
                </span>
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{card.legalIssue}</div>
              <div className="mt-2 space-y-1 text-slate-600">
                <div><strong className="text-slate-800">Governing Law:</strong> {card.governingLaw}</div>
                <div><strong className="text-slate-800">Provisions:</strong> {card.relevantProvisions}</div>
                <div><strong className="text-slate-800">Subordinate Law:</strong> {card.rulesAndNotifications}</div>
                <div><strong className="text-slate-800">Procedure:</strong> {card.procedure}</div>
                <div><strong className="text-slate-800">Remedies:</strong> {card.remedies}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Judicial Decision Database */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Gavel className="h-4 w-4 text-slate-700" />
          Judicial Decision Database
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          No judgment is treated as verified merely from an AI mention; citations and good-law status must be verified against official court portals.
        </p>
        <div className="mt-4 space-y-3">
          {db.judgments.map((j) => (
            <div key={j.decisionId} className="rounded-lg border border-slate-200 p-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-slate-900">{j.caseName}</div>
                <span
                  className={`font-semibold ${
                    j.verificationStatus === 'Verified' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {j.verificationStatus} · {j.remainsGoodLaw ? 'Good Law' : 'Check Overruling'}
                </span>
              </div>
              <div className="mt-1 text-slate-500">
                {j.court} · {j.dateOfDecision} · Citation: <span className="font-mono text-slate-800">{j.reportedCitation}</span> · {j.relevantParagraphs}
              </div>
              <p className="mt-1.5 text-slate-700">
                <strong>Ratio Decidendi:</strong> {j.ratioDecidendi}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
