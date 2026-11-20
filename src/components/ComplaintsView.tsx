import React, { useState } from 'react';
import { CheckCircle2, Clock, Cpu, ExternalLink, Plus, Scale } from 'lucide-react';
import { REMEDY_CLASSIFICATION_MATRIX } from '../data/seedData.ts';
import type { BankComplaint, BankingMatter, OmbudsmanEligibilityCheck } from '../types.ts';

interface Props {
  matter: BankingMatter;
  onAddComplaint: (matterId: string, payload: Partial<BankComplaint>) => Promise<void>;
  onRunOmbudsmanCheck: (
    matterId: string,
    payload: {
      complaintDate?: string;
      bankResponse?: string;
      bankResponseDate?: string;
      hasWrittenProof: boolean;
      pendingInCourt: boolean;
      commercialJudgmentOnly: boolean;
    }
  ) => Promise<OmbudsmanEligibilityCheck>;
  onDraftComplaint: (
    matterId: string,
    target: 'Bank Grievance Redressal Officer' | 'RBI Integrated Ombudsman (CMS)'
  ) => Promise<void>;
}

const WORKFLOW_STEPS = [
  'Banking Problem',
  'Customer Complaint',
  'Bank Complaint Ref',
  'Acknowledgement',
  'Bank Response',
  'Satisfaction Check',
  'Eligibility Review',
  'Possible Escalation',
  'Outcome',
];

export function ComplaintsView({
  matter,
  onAddComplaint,
  onRunOmbudsmanCheck,
  onDraftComplaint,
}: Props) {
  const latestComplaint = matter.complaints[0];
  const [showAdd, setShowAdd] = useState(false);
  const [channel, setChannel] = useState<BankComplaint['channel']>('Bank Portal');
  const [complaintDate, setComplaintDate] = useState('2026-11-11');
  const [bankReferenceNumber, setBankReferenceNumber] = useState('');
  const [bankResponse, setBankResponse] = useState('');
  const [bankResponseDate, setBankResponseDate] = useState('');
  const [nextAction, setNextAction] = useState('Track 30-day statutory bank response deadline.');

  // Ombudsman 2026 interactive checklist state
  const [hasWrittenProof, setHasWrittenProof] = useState(Boolean(latestComplaint));
  const [pendingInCourt, setPendingInCourt] = useState(false);
  const [commercialJudgmentOnly, setCommercialJudgmentOnly] = useState(false);
  const [checkingElig, setCheckingElig] = useState(false);

  const [draftingTarget, setDraftingTarget] = useState<string | null>(null);
  const [draftError, setDraftError] = useState('');

  // Deadline calculation
  const deadlineInfo = (() => {
    if (!latestComplaint?.complaintDate) {
      return {
        warning: 'Cannot safely calculate 30-day / 90-day Ombudsman deadlines until bank complaint date is recorded.',
        thirtyDayExpiry: null,
        ninetyDayWindowEnd: null,
      };
    }
    const cDate = new Date(latestComplaint.complaintDate);
    const thirtyDay = new Date(cDate.getTime() + 30 * 86400000);
    const baseFor90 = latestComplaint.bankResponseDate
      ? new Date(latestComplaint.bankResponseDate)
      : thirtyDay;
    const ninetyDayEnd = new Date(baseFor90.getTime() + 90 * 86400000);

    return {
      warning: null,
      thirtyDayExpiry: thirtyDay.toISOString().slice(0, 10),
      ninetyDayWindowEnd: ninetyDayEnd.toISOString().slice(0, 10),
    };
  })();

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onAddComplaint(matter.matterId, {
      channel,
      complaintDate,
      bankReferenceNumber,
      bankResponse,
      bankResponseDate: bankResponseDate || undefined,
      nextAction,
      status: bankResponse ? 'Pending' : 'Submitted',
    });
    setShowAdd(false);
    setBankReferenceNumber('');
    setBankResponse('');
  }

  async function handleCheckEligibility() {
    setCheckingElig(true);
    try {
      await onRunOmbudsmanCheck(matter.matterId, {
        complaintDate: latestComplaint?.complaintDate,
        bankResponse: latestComplaint?.bankResponse,
        bankResponseDate: latestComplaint?.bankResponseDate,
        hasWrittenProof,
        pendingInCourt,
        commercialJudgmentOnly,
      });
    } finally {
      setCheckingElig(false);
    }
  }

  async function handleGenerateDraft(
    target: 'Bank Grievance Redressal Officer' | 'RBI Integrated Ombudsman (CMS)'
  ) {
    setDraftError('');
    setDraftingTarget(target);
    try {
      await onDraftComplaint(matter.matterId, target);
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'Draft generation failed.');
    } finally {
      setDraftingTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Lifecycle Stepper */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Banking Complaint & RBI Ombudsman 2026 Workflow · {matter.matterId}
            </h2>
            <p className="text-xs text-slate-500">
              Internal Complaint IDs (CMP-2026-XXX) are maintained separately from official bank reference numbers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Record Bank Complaint
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs sm:grid-cols-5 lg:grid-cols-9">
          {WORKFLOW_STEPS.map((step, i) => {
            const active =
              (i <= 2 && Boolean(latestComplaint)) ||
              (i === 3 && Boolean(latestComplaint?.bankReferenceNumber)) ||
              (i === 4 && Boolean(latestComplaint?.bankResponse)) ||
              (i >= 5 && i <= 6 && Boolean(matter.ombudsmanCheck));
            return (
              <div
                key={step}
                className={`rounded-lg border px-2.5 py-2 ${
                  active
                    ? 'border-blue-200 bg-blue-50/70 text-blue-900 font-medium'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                <div className="font-mono text-[10px] text-slate-400">0{i + 1}</div>
                <div className="mt-0.5 leading-tight">{step}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Complaint Form */}
      {showAdd && (
        <form onSubmit={handleAddSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Log Bank Grievance Submission</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as BankComplaint['channel'])}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                <option value="Bank Portal">Bank Portal</option>
                <option value="Email">Email</option>
                <option value="Branch">Branch</option>
                <option value="Phone">Phone</option>
                <option value="Written Post">Written Post</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Complaint Date</label>
              <input
                type="date"
                required
                value={complaintDate}
                onChange={(e) => setComplaintDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Official Bank Reference No.
              </label>
              <input
                type="text"
                value={bankReferenceNumber}
                onChange={(e) => setBankReferenceNumber(e.target.value)}
                placeholder="e.g., NCB-GRV-2026-88419"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Bank Reply Date (if any)</label>
              <input
                type="date"
                value={bankResponseDate}
                onChange={(e) => setBankResponseDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Bank Response Summary</label>
              <textarea
                rows={2}
                value={bankResponse}
                onChange={(e) => setBankResponse(e.target.value)}
                placeholder="Leave blank if no response received yet..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Next Planned Action</label>
              <textarea
                rows={2}
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white"
            >
              Save Complaint Record
            </button>
          </div>
        </form>
      )}

      {/* Recorded Complaints & Deadline Engine */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-7">
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h3 className="text-sm font-semibold text-slate-900">
              Recorded Complaints ({matter.complaints.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {matter.complaints.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No bank complaint logged yet. Use "Record Bank Complaint" above or generate a draft below.
              </div>
            ) : (
              matter.complaints.map((c) => (
                <div key={c.complaintId} className="space-y-2 p-5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-slate-500">
                      <span className="font-mono font-semibold text-slate-900">{c.complaintId}</span>
                      <span>·</span>
                      <span>Bank Ref: <span className="font-mono font-medium text-slate-900">{c.bankReferenceNumber || 'Pending'}</span></span>
                      <span>·</span>
                      <span>{c.channel}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{c.complaintDate}</span>
                    </div>
                    <span className="font-semibold text-blue-700">{c.status}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-900">{c.bankName} — {c.category}</div>
                  <div className="text-slate-600">
                    <span className="font-medium text-slate-800">Bank Response:</span>{' '}
                    {c.bankResponse || 'No response recorded yet.'}
                  </div>
                  <div className="text-slate-600">
                    <span className="font-medium text-slate-800">Next Action:</span> {c.nextAction}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deadline & Reminder Engine */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Deadline & Reminder Engine</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Source-linked procedural dates (calendar days). A reminder is not a legal determination that limitation has started, expired, or been extended.
          </p>

          {deadlineInfo.warning ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              {deadlineInfo.warning}
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-600">Date Bank Received Complaint</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {latestComplaint?.complaintDate}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-600">30-Calendar-Day Bank Wait Expiry</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {deadlineInfo.thirtyDayExpiry}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-600">90-Day RBI Ombudsman Filing Window End</span>
                <span className="font-mono font-semibold text-amber-700 tabular-nums">
                  {deadlineInfo.ninetyDayWindowEnd}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Basis: RBI Integrated Ombudsman Scheme, 2026 (90 days from expiry of 30-day response period or last bank communication, whichever is later, plus Limitation Act 1963 check).
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5-Step RBI Integrated Ombudsman Scheme, 2026 Eligibility Checker */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Scale className="h-4 w-4 text-blue-700" />
              RBI Integrated Ombudsman Scheme, 2026 — 5-Step Maintainability Check
            </h3>
            <p className="text-xs text-slate-500">
              Applicable from 1 July 2026 (current framework as of 20 November 2026). Not every banking complaint is eligible.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCheckEligibility}
            disabled={checkingElig}
            className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-medium text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            {checkingElig ? 'Evaluating...' : 'Re-Evaluate 5-Step Eligibility'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-2.5 text-xs lg:col-span-5">
            <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={hasWrittenProof}
                onChange={(e) => setHasWrittenProof(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <strong className="text-slate-900">Step 1:</strong> Written complaint submitted to regulated entity first and proof retained.
              </span>
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={pendingInCourt}
                onChange={(e) => setPendingInCourt(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <strong className="text-slate-900">Exclusion Check:</strong> Same grievance is already pending before or decided by a court, tribunal, or arbitrator.
              </span>
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={commercialJudgmentOnly}
                onChange={(e) => setCommercialJudgmentOnly(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <strong className="text-slate-900">Scope Check:</strong> Matter involves commercial judgment or services outside RBI regulatory purview.
              </span>
            </label>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs lg:col-span-7">
            {matter.ombudsmanCheck ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">Preliminary Eligibility Assessment</span>
                  <span
                    className={`font-semibold ${
                      matter.ombudsmanCheck.preliminaryResult.startsWith('Potentially')
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {matter.ombudsmanCheck.preliminaryResult}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                  <div className="rounded border border-slate-200 bg-white p-2">
                    <div className="text-slate-500">Step 1 Prior Bank</div>
                    <div className="font-semibold text-slate-900">
                      {matter.ombudsmanCheck.step1ApproachedBank ? 'Yes' : 'Missing'}
                    </div>
                  </div>
                  <div className="rounded border border-slate-200 bg-white p-2">
                    <div className="text-slate-500">Step 2 Response</div>
                    <div className="font-semibold text-slate-900">
                      {matter.ombudsmanCheck.step2ResponsePeriodResult}
                    </div>
                  </div>
                  <div className="rounded border border-slate-200 bg-white p-2">
                    <div className="text-slate-500">Step 3 90-Day Limit</div>
                    <div className="font-semibold text-slate-900">
                      {matter.ombudsmanCheck.step3WithinTimeLimit ? 'Within Limit' : 'Risk'}
                    </div>
                  </div>
                  <div className="rounded border border-slate-200 bg-white p-2">
                    <div className="text-slate-500">Step 4 Entity Covered</div>
                    <div className="font-semibold text-slate-900">
                      {matter.ombudsmanCheck.step4EntityCovered ? 'Covered Category' : 'Check Scope'}
                    </div>
                  </div>
                </div>
                <p className="text-slate-700">{matter.ombudsmanCheck.rationale}</p>
                {matter.ombudsmanCheck.step5MaintainabilityFlags.length > 0 && (
                  <ul className="list-disc space-y-1 pl-4 text-amber-800">
                    {matter.ombudsmanCheck.step5MaintainabilityFlags.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-slate-500">Click "Re-Evaluate 5-Step Eligibility" to run the 2026 Scheme check.</p>
            )}
          </div>
        </div>

        {/* Official RBI Channels */}
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 text-xs sm:grid-cols-4">
          <div>
            <div className="font-medium text-slate-500">Online Portal (Cost-Free)</div>
            <a
              href="https://cms.rbi.org.in/"
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
            >
              cms.rbi.org.in <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div>
            <div className="font-medium text-slate-500">Email Channel</div>
            <div className="mt-0.5 font-mono text-slate-900">crpc@rbi.org.in</div>
          </div>
          <div>
            <div className="font-medium text-slate-500">Physical CRPC Address</div>
            <div className="mt-0.5 text-slate-700">Central Vista, Sector 17, Chandigarh – 160017</div>
          </div>
          <div>
            <div className="font-medium text-slate-500">RBI Contact Centre</div>
            <div className="mt-0.5 text-slate-700">14448 (assistance & status info only)</div>
          </div>
        </div>
      </div>

      {/* Complaint Drafting Engine */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Complaint Drafting Engine</h3>
            <p className="text-xs text-slate-500">
              Generates separate structured draft templates for Bank GRO and RBI Ombudsman CMS. Must be reviewed and approved before submission.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleGenerateDraft('Bank Grievance Redressal Officer')}
              disabled={draftingTarget !== null}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              <Cpu className="h-3.5 w-3.5 text-blue-700" />
              {draftingTarget === 'Bank Grievance Redressal Officer'
                ? 'Drafting GRO...'
                : 'Draft Bank GRO Complaint'}
            </button>
            <button
              type="button"
              onClick={() => handleGenerateDraft('RBI Integrated Ombudsman (CMS)')}
              disabled={draftingTarget !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              <Cpu className="h-3.5 w-3.5" />
              {draftingTarget === 'RBI Integrated Ombudsman (CMS)'
                ? 'Drafting Ombudsman...'
                : 'Draft RBI Ombudsman Complaint'}
            </button>
          </div>
        </div>

        {draftError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {draftError}
          </div>
        )}

        <div className="mt-4 space-y-4">
          {matter.complaintDrafts.length === 0 ? (
            <p className="text-sm text-slate-500">
              No drafts generated for this matter yet. Use the drafting buttons above.
            </p>
          ) : (
            matter.complaintDrafts.map((drf) => (
              <div key={drf.draftId} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div>
                    <span className="font-mono font-semibold text-slate-900">{drf.draftId}</span> ·{' '}
                    <span className="font-medium text-blue-700">{drf.target}</span> · {drf.createdAt}
                  </div>
                  <span className="font-medium text-amber-700">{drf.status}</span>
                </div>
                <div className="mt-1.5 text-sm font-semibold text-slate-900">{drf.subject}</div>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800">
                  {drf.body}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Remedy Classification Matrix */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900">
          Separate Procedural Remedy Routes (Not Mutually Interchangeable)
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 pr-4 font-medium">Problem Type</th>
                <th className="pb-2 pr-4 font-medium">Possible Route for Assessment</th>
                <th className="pb-2 font-medium">Procedural Constraint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {REMEDY_CLASSIFICATION_MATRIX.map((r) => (
                <tr key={r.problem}>
                  <td className="py-2.5 pr-4 font-medium text-slate-900">{r.problem}</td>
                  <td className="py-2.5 pr-4 text-blue-800">{r.route}</td>
                  <td className="py-2.5 text-slate-600">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
