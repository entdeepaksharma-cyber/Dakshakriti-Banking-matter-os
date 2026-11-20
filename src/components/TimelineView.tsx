import React, { useState } from 'react';
import { AlertCircle, Calendar, Download, History, Plus } from 'lucide-react';
import type { BankingMatter, EventType, TimelineEvent } from '../types.ts';

interface Props {
  matter: BankingMatter;
  onAddEvent: (matterId: string, event: Partial<TimelineEvent>) => Promise<void>;
}

const EVENT_TYPES: EventType[] = [
  'Transaction',
  'Customer communication',
  'Bank communication',
  'Complaint and escalation',
  'Legal or procedural',
];

export function TimelineView({ matter, onAddEvent }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('2026-11-16');
  const [isEstimatedDate, setIsEstimatedDate] = useState(false);
  const [eventType, setEventType] = useState<EventType>('Customer communication');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onAddEvent(matter.matterId, {
        date,
        isEstimatedDate,
        eventType,
        title: title.trim(),
        description: description.trim(),
        linkedEvidenceIds: selectedEvidenceIds,
        createdBy: 'Customer',
      });
      setShowForm(false);
      setTitle('');
      setDescription('');
      setSelectedEvidenceIds([]);
    } finally {
      setSaving(false);
    }
  }

  function exportChronologyMarkdown() {
    const lines = [
      `# Evidence Chronology & Document Index — ${matter.matterId}`,
      `Matter: ${matter.title}`,
      `Bank: ${matter.bank.bankName} (${matter.bank.bankCategory})`,
      '',
      '## Chronological Event Sequence',
      '| Date | Date Basis | Event Type | Event | Supporting Evidence |',
      '| --- | --- | --- | --- | --- |',
      ...matter.timeline.map(
        (ev) =>
          `| ${ev.date} | ${ev.isEstimatedDate ? 'Estimated' : 'Exact'} | ${ev.eventType} | ${ev.title} | ${
            ev.linkedEvidenceIds.join(', ') || 'No supporting evidence attached'
          } |`
      ),
      '',
      '## Document Index',
      '| Evidence ID | Document Name | Category | Document Date | Upload Date | Verification |',
      '| --- | --- | --- | --- | --- | --- |',
      ...matter.evidence.map(
        (d) =>
          `| ${d.evidenceId} | ${d.documentName} | ${d.category} | ${d.documentDate} | ${d.uploadDate} | ${d.verificationStatus} |`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${matter.matterId}_Chronology_and_Index.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Evidence Chronology · {matter.matterId}
          </h2>
          <p className="text-xs text-slate-500">
            Connects every factual event to preserved evidence while flagging exact vs. estimated dates and record inconsistencies.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={exportChronologyMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" /> Export Chronology & Index
          </button>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" /> Add Timeline Event
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">Record Chronological Event</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Event Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={isEstimatedDate}
                  onChange={(e) => setIsEstimatedDate(e.target.checked)}
                />
                Mark as estimated date (unconfirmed)
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Event Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Customer submitted supplementary logs to Nodal Officer"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Factual Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          {matter.evidence.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Link Supporting Evidence
              </label>
              <div className="flex flex-wrap gap-2">
                {matter.evidence.map((doc) => {
                  const checked = selectedEvidenceIds.includes(doc.evidenceId);
                  return (
                    <label
                      key={doc.evidenceId}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedEvidenceIds((prev) =>
                            checked
                              ? prev.filter((id) => id !== doc.evidenceId)
                              : [...prev, doc.evidenceId]
                          )
                        }
                      />
                      <span className="font-mono font-medium">{doc.evidenceId}</span>
                      <span>({doc.documentName})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
            >
              {saving ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Chronology Table */}
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-8">
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h3 className="text-sm font-semibold text-slate-900">
              Chronological Event List ({matter.timeline.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {matter.timeline.map((ev) => (
              <div key={ev.eventId} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:gap-6">
                <div className="w-36 shrink-0">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {ev.date}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {ev.isEstimatedDate ? 'Estimated date' : 'Exact date'}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{ev.eventId}</span>
                    <span>·</span>
                    <span className="font-medium text-blue-700">{ev.eventType}</span>
                    <span>·</span>
                    <span>By {ev.createdBy}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-900">{ev.title}</div>
                  {ev.description && <p className="text-xs text-slate-600">{ev.description}</p>}
                  <div className="pt-1 text-xs text-slate-500">
                    Supporting Evidence:{' '}
                    {ev.linkedEvidenceIds.length > 0 ? (
                      <span className="font-mono font-medium text-slate-800">
                        {ev.linkedEvidenceIds.join(', ')}
                      </span>
                    ) : (
                      <span className="font-medium text-amber-700">
                        No supporting evidence linked yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Inconsistency Detection, Missing Info & Version History */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Inconsistency Review Alerts
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Review alerts only — not findings of fraud or legal wrongdoing.
            </p>
            <div className="mt-3 space-y-2.5">
              {matter.consistencyAlerts.length === 0 ? (
                <p className="text-xs text-slate-500">No chronological inconsistencies detected.</p>
              ) : (
                matter.consistencyAlerts.map((a) => (
                  <div key={a.alertId} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
                    <div className="font-semibold text-amber-900">{a.issueType}</div>
                    <p className="mt-1 text-amber-800">{a.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Missing-Evidence & Fact Gaps</h3>
            <ul className="mt-3 space-y-2.5 text-xs">
              {matter.missingQuestions.map((q) => (
                <li key={q.questionId} className="border-b border-slate-100 pb-2 last:border-0">
                  <div className="font-medium text-slate-900">{q.question}</div>
                  <div className="mt-0.5 text-slate-500">{q.whyRelevant}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <History className="h-4 w-4 text-slate-500" />
              Chronology Version History
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              {matter.chronologyVersions.map((v) => (
                <div key={v.versionId} className="border-b border-slate-100 pb-2 last:border-0">
                  <div className="flex justify-between font-mono text-slate-700">
                    <span className="font-semibold">{v.versionId}</span>
                    <span>{v.eventCount} events</span>
                  </div>
                  <div className="mt-0.5 text-slate-600">{v.summary}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
