import React from 'react';
import { Download, Printer } from 'lucide-react';
import { evaluateDateSensitiveRules } from '../data/seedData.ts';
import type { BankingMatter } from '../types.ts';

interface Props {
  matter: BankingMatter;
}

export function MatterReportView({ matter }: Props) {
  const dateRules = evaluateDateSensitiveRules(
    matter.transaction.transactionDate,
    matter.bank.bankCategory
  );

  const verifiedFacts = matter.extractedFacts.filter((f) => f.verificationStatus === 'Verified');
  const unverifiedFacts = matter.extractedFacts.filter((f) => f.verificationStatus !== 'Verified');

  function downloadJsonReport() {
    const blob = new Blob([JSON.stringify(matter, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${matter.matterId}_Matter_Report.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadEvidenceIndexCsv() {
    const header = 'Evidence ID,Matter ID,Document Name,Category,Document Date,Upload Date,Source,Origin,Verification Status\n';
    const rows = matter.evidence
      .map(
        (d) =>
          `"${d.evidenceId}","${d.matterId}","${d.documentName}","${d.category}","${d.documentDate}","${d.uploadDate}","${d.source}","${d.originType}","${d.verificationStatus}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${matter.matterId}_Evidence_Index.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="no-print flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Structured Matter Report · {matter.matterId}
          </h2>
          <p className="text-xs text-slate-500">
            Strictly separates verified document-supported facts, user-provided statements, AI-extracted records, and unresolved questions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadEvidenceIndexCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" /> Export Evidence Index (.csv)
          </button>
          <button
            type="button"
            onClick={downloadJsonReport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" /> Export JSON Dossier
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Report Document */}
      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-800">
        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-900">DAKSHAKRITI · BANKING MATTER OS</span>
            <span className="font-mono">Generated {new Date().toISOString().slice(0, 10)}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{matter.title}</h1>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
            <span>Matter ID: <strong className="font-mono text-slate-900">{matter.matterId}</strong></span>
            <span>·</span>
            <span>Category: {matter.category}</span>
            <span>·</span>
            <span>Status: {matter.status}</span>
            {matter.isIllustrative && (
              <>
                <span>·</span>
                <span className="font-semibold text-amber-700">ILLUSTRATIVE MATTER — NOT AN ACTUAL CUSTOMER CASE</span>
              </>
            )}
          </div>
        </div>

        {/* 1. Customer & Bank Details + Transaction */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-500">01. Customer Information</h3>
            <div className="mt-1.5 space-y-0.5 text-xs">
              <div className="font-semibold text-slate-900">{matter.customer.name}</div>
              <div>Type: {matter.customer.customerType}</div>
              <div>{matter.customer.cityState}</div>
              <div>{matter.customer.contactEmail}</div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500">02. Bank & Account Details</h3>
            <div className="mt-1.5 space-y-0.5 text-xs">
              <div className="font-semibold text-slate-900">{matter.bank.bankName}</div>
              <div>Category: {matter.bank.bankCategory}</div>
              <div>Branch: {matter.bank.branch}</div>
              <div>A/c Ref: <span className="font-mono">{matter.bank.accountReference}</span> ({matter.bank.accountType})</div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500">03. Disputed Transaction</h3>
            <div className="mt-1.5 space-y-0.5 text-xs">
              <div>Date: <strong className="font-mono">{matter.transaction.transactionDate}</strong></div>
              <div>Amount: <strong className="font-mono">₹{matter.transaction.amountInr.toLocaleString('en-IN')}</strong></div>
              <div>Ref: <span className="font-mono">{matter.transaction.transactionReference}</span></div>
              <div>Method: {matter.transaction.paymentMethod}</div>
            </div>
          </div>
        </div>

        {/* 2. Customer Statement vs Verified Facts */}
        <div className="grid grid-cols-1 gap-6 border-t border-slate-200 pt-5 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-500">04. Customer Account of Events (User-Provided Statement)</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-700">{matter.problem.whatHappened}</p>
            <p className="mt-2 text-xs text-slate-600">
              <strong>Expected:</strong> {matter.problem.customerExpected}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              <strong>Actual:</strong> {matter.problem.whatActuallyHappened}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500">05. Facts Established by Records vs Unverified Facts</h3>
            <div className="mt-2 space-y-2 text-xs">
              <div className="font-semibold text-emerald-700">Verified / Document-Supported ({verifiedFacts.length})</div>
              {verifiedFacts.map((f) => (
                <div key={f.factId} className="text-slate-700">
                  <span className="font-mono font-medium">{f.factId}</span> ({f.date}): {f.description} [{f.sourceDocumentId}]
                </div>
              ))}
              {unverifiedFacts.length > 0 && (
                <>
                  <div className="pt-2 font-semibold text-amber-700">
                    Unverified / AI-Extracted Pending Confirmation ({unverifiedFacts.length})
                  </div>
                  {unverifiedFacts.map((f) => (
                    <div key={f.factId} className="text-slate-600">
                      <span className="font-mono font-medium">{f.factId}</span> ({f.date}): {f.description} [{f.verificationStatus}]
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. Chronology */}
        <div className="border-t border-slate-200 pt-5">
          <h3 className="text-xs font-semibold text-slate-500">06. Chronology of Events</h3>
          <table className="mt-2 w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Event</th>
                <th className="py-2 font-medium">Supporting Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matter.timeline.map((ev) => (
                <tr key={ev.eventId}>
                  <td className="py-2 pr-3 font-mono tabular-nums whitespace-nowrap">{ev.date}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{ev.eventType}</td>
                  <td className="py-2 pr-3 font-medium text-slate-900">{ev.title}</td>
                  <td className="py-2 font-mono">{ev.linkedEvidenceIds.join(', ') || 'Missing'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Evidence Index */}
        <div className="border-t border-slate-200 pt-5">
          <h3 className="text-xs font-semibold text-slate-500">07. Indexed Evidence Records</h3>
          <table className="mt-2 w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3 font-medium">ID</th>
                <th className="py-2 pr-3 font-medium">Document Name</th>
                <th className="py-2 pr-3 font-medium">Category</th>
                <th className="py-2 pr-3 font-medium">Doc Date</th>
                <th className="py-2 font-medium">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matter.evidence.map((d) => (
                <tr key={d.evidenceId}>
                  <td className="py-2 pr-3 font-mono">{d.evidenceId}</td>
                  <td className="py-2 pr-3">{d.documentName}</td>
                  <td className="py-2 pr-3">{d.category}</td>
                  <td className="py-2 pr-3 font-mono tabular-nums">{d.documentDate}</td>
                  <td className="py-2">{d.verificationStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 5. Complaint History, Applicable Law, Legal Issues & Unresolved Questions */}
        <div className="grid grid-cols-1 gap-6 border-t border-slate-200 pt-5 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-500">08. Bank Complaint History & Ombudsman Check</h3>
            {matter.complaints.map((c) => (
              <div key={c.complaintId} className="mt-2 text-xs">
                <div>
                  <strong>{c.complaintId}</strong> (Bank Ref: <span className="font-mono">{c.bankReferenceNumber}</span>) on {c.complaintDate} — Status: {c.status}
                </div>
                <div className="text-slate-600">Bank Reply: {c.bankResponse || 'Pending'}</div>
              </div>
            ))}
            {matter.ombudsmanCheck && (
              <div className="mt-2 text-xs text-slate-700">
                <strong>2026 Ombudsman Assessment:</strong> {matter.ombudsmanCheck.preliminaryResult}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500">09. Date-Sensitive Legal Framework & Preliminary Issues</h3>
            <div className="mt-2 text-xs text-slate-700">
              <div><strong>Applicable Rule Set:</strong> {dateRules.applicableLiabilityRule.title} ({dateRules.applicableLiabilityRule.sourceId})</div>
              <ul className="mt-1.5 list-disc space-y-1 pl-4">
                {matter.legalIssues.map((iss) => (
                  <li key={iss.issueId}>
                    <strong>[{iss.statusLabel}]</strong> {iss.title} ({iss.classification})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 6. Unresolved Questions & Professional Assessment */}
        <div className="grid grid-cols-1 gap-6 border-t border-slate-200 pt-5 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-500">10. Unresolved Questions & Documents Required</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
              {matter.missingQuestions.map((q) => (
                <li key={q.questionId}>{q.question}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500">11. Independent Advocate Assessment</h3>
            {matter.collaboration.professionalNotes.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">Pending independent professional review.</p>
            ) : (
              matter.collaboration.professionalNotes.map((n) => (
                <div key={n.noteId} className="mt-2 text-xs text-slate-700">
                  <strong>{n.authorName} ({n.createdAt}):</strong> {n.content}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-500">
          Disclaimer: Dakshakriti organises factual records, evidence chronologies, and verified statutory/RBI references. It does not replace a qualified advocate, nor does it guarantee legal outcomes or Ombudsman awards.
        </div>
      </div>
    </div>
  );
}
