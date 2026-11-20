import React, { useState } from 'react';
import { Check, Lock, ShieldCheck, UserPlus, XCircle } from 'lucide-react';
import type { AuditLogEntry, BankingMatter, LawyerPermissionSet, UserRoleView } from '../types.ts';

interface Props {
  matter: BankingMatter;
  roleView: UserRoleView;
  auditLogs: AuditLogEntry[];
  onRoleSwitch: (role: UserRoleView) => void;
  onCollaborationAction: (
    matterId: string,
    action: string,
    payload: Record<string, unknown>
  ) => Promise<void>;
}

export function CollaborationView({
  matter,
  roleView,
  auditLogs,
  onRoleSwitch,
  onCollaborationAction,
}: Props) {
  const { collaboration } = matter;
  const [advName, setAdvName] = useState(collaboration.invitedAdvocateName || 'Adv. Priya Nair');
  const [advBarId, setAdvBarId] = useState(collaboration.invitedAdvocateBarId || 'R/2841/2018');
  const [advJurisdiction, setAdvJurisdiction] = useState(
    collaboration.invitedAdvocateJurisdiction || 'High Court & Consumer Commissions'
  );

  // Advocate action states
  const [noteCategory, setNoteCategory] = useState<'Legal Analysis' | 'Liability Assessment' | 'Procedural Strategy' | 'Questions for Client'>('Legal Analysis');
  const [noteContent, setNoteContent] = useState('');
  const [reqTitle, setReqTitle] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');

  const matterLogs = auditLogs.filter((l) => l.matterId === matter.matterId);

  async function togglePermission(key: keyof Omit<LawyerPermissionSet, 'selectedDocumentIds'>) {
    await onCollaborationAction(matter.matterId, 'updatePermissions', {
      [key]: !collaboration.permissions[key],
    });
  }

  async function toggleDocPermission(evidenceId: string) {
    const current = collaboration.permissions.selectedDocumentIds;
    const next = current.includes(evidenceId)
      ? current.filter((id) => id !== evidenceId)
      : [...current, evidenceId];
    await onCollaborationAction(matter.matterId, 'updatePermissions', {
      selectedDocumentIds: next,
    });
  }

  return (
    <div className="space-y-6">
      {/* BCI Rule 36 Compliance & Role Switch Toolbar */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-center">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">
            Secure Client–Advocate Collaboration · {matter.matterId}
          </h2>
          <p className="text-xs text-slate-600">
            Bar Council of India Rule 36 Compliance: Dakshakriti does not sell lawyer leads, rank advocates by paid placement, or charge referral commissions. The customer invites an independently selected advocate.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 shrink-0">
          <button
            type="button"
            onClick={() => onRoleSwitch('customer')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
              roleView === 'customer'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Control View
          </button>
          <button
            type="button"
            onClick={() => onRoleSwitch('advocate')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
              roleView === 'advocate'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Advocate Workspace View
          </button>
        </div>
      </div>

      {/* Customer Control Mode */}
      {roleView === 'customer' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Invite & Revocation Panel */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <UserPlus className="h-4 w-4 text-blue-700" />
                Independent Advocate Invitation
              </h3>
              <span
                className={`text-xs font-semibold ${
                  collaboration.invitationStatus === 'Accepted'
                    ? 'text-emerald-700'
                    : collaboration.invitationStatus === 'Revoked'
                    ? 'text-red-700'
                    : 'text-amber-700'
                }`}
              >
                {collaboration.invitationStatus}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-medium text-slate-700">Advocate Full Name</label>
                <input
                  type="text"
                  value={advName}
                  onChange={(e) => setAdvName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Bar Council Enrolment ID</label>
                <input
                  type="text"
                  value={advBarId}
                  onChange={(e) => setAdvBarId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-slate-700">Jurisdiction / Practice Focus</label>
                <input
                  type="text"
                  value={advJurisdiction}
                  onChange={(e) => setAdvJurisdiction(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  onCollaborationAction(matter.matterId, 'invite', {
                    name: advName,
                    barId: advBarId,
                    jurisdiction: advJurisdiction,
                  })
                }
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                {collaboration.invitationStatus === 'Accepted'
                  ? 'Update Invited Advocate'
                  : 'Grant Matter Access'}
              </button>
              {collaboration.invitationStatus === 'Accepted' && (
                <button
                  type="button"
                  onClick={() =>
                    onCollaborationAction(matter.matterId, 'revoke', {
                      reason: 'Access revoked by customer via Permission Controls',
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                >
                  <XCircle className="h-3.5 w-3.5" /> Revoke Access
                </button>
              )}
            </div>
          </div>

          {/* 8 Granular Permissions + Document Selection */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Lock className="h-4 w-4 text-blue-700" />
              Customer-Controlled Permission Architecture
            </h3>
            <p className="text-xs text-slate-500">
              Toggle permissions below and switch to "Advocate Workspace View" to verify real-time enforcement.
            </p>

            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              {[
                ['viewMatterFacts', 'View matter facts'],
                ['viewChronology', 'View chronology'],
                ['viewSelectedDocuments', 'View selected documents'],
                ['uploadAdditionalEvidence', 'Upload additional evidence'],
                ['addProfessionalComments', 'Add professional comments'],
                ['prepareLegalDrafts', 'Prepare legal drafts'],
                ['downloadDocuments', 'Download original documents'],
                ['inviteAnotherProfessional', 'Invite another professional'],
              ].map(([key, label]) => {
                const k = key as keyof Omit<LawyerPermissionSet, 'selectedDocumentIds'>;
                return (
                  <label
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <span className="text-slate-800">{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(collaboration.permissions[k])}
                      onChange={() => togglePermission(k)}
                    />
                  </label>
                );
              })}
            </div>

            {collaboration.permissions.viewSelectedDocuments && (
              <div className="border-t border-slate-100 pt-3">
                <div className="mb-2 text-xs font-medium text-slate-700">
                  Select Individual Documents Shared with Advocate ({collaboration.permissions.selectedDocumentIds.length} of {matter.evidence.length})
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  {matter.evidence.map((d) => (
                    <label
                      key={d.evidenceId}
                      className="flex items-center gap-2 rounded border border-slate-200 px-2.5 py-1.5"
                    >
                      <input
                        type="checkbox"
                        checked={collaboration.permissions.selectedDocumentIds.includes(d.evidenceId)}
                        onChange={() => toggleDocPermission(d.evidenceId)}
                      />
                      <span className="font-mono font-medium">{d.evidenceId}</span>
                      <span className="truncate text-slate-600">{d.documentName}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Advocate Workspace View OR Shared Legal Drafts & Requests */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Confidential Professional Notes (Separate from Client Original Evidence) */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Confidential Lawyer Work Product & Notes
              </h3>
              <p className="text-xs text-slate-500">
                Stored separately from original customer evidence.
              </p>
            </div>
            <ShieldCheck className="h-4 w-4 text-slate-400" />
          </div>

          {roleView === 'advocate' &&
            collaboration.invitationStatus === 'Accepted' &&
            collaboration.permissions.addProfessionalComments && (
              <div className="space-y-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as typeof noteCategory)}
                  className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                >
                  <option value="Legal Analysis">Legal Analysis</option>
                  <option value="Liability Assessment">Liability Assessment</option>
                  <option value="Procedural Strategy">Procedural Strategy</option>
                  <option value="Questions for Client">Questions for Client</option>
                </select>
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter independent legal assessment..."
                  className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!noteContent.trim()) return;
                    await onCollaborationAction(matter.matterId, 'addNote', {
                      category: noteCategory,
                      content: noteContent.trim(),
                    });
                    setNoteContent('');
                  }}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white"
                >
                  Record Professional Note
                </button>
              </div>
            )}

          <div className="space-y-3">
            {collaboration.professionalNotes.map((n) => (
              <div key={n.noteId} className="rounded-lg border border-slate-200 p-3.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span className="font-semibold text-slate-900">
                    {n.authorName} · {n.category}
                  </span>
                  <span className="font-mono">{n.createdAt}</span>
                </div>
                <p className="mt-1.5 leading-relaxed text-slate-700">{n.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Drafts (Version History + Client Approval) & Document Requests */}
        <div className="space-y-6 lg:col-span-6">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900">
              Legal Drafts & Client Approval History
            </h3>

            {roleView === 'advocate' &&
              collaboration.invitationStatus === 'Accepted' &&
              collaboration.permissions.prepareLegalDrafts && (
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Draft title (e.g., Legal Notice to Bank)"
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                  />
                  <textarea
                    rows={3}
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    placeholder="Draft body..."
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!draftTitle.trim() || !draftContent.trim()) return;
                      await onCollaborationAction(matter.matterId, 'addDraft', {
                        title: draftTitle.trim(),
                        content: draftContent.trim(),
                      });
                      setDraftTitle('');
                      setDraftContent('');
                    }}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white"
                  >
                    Submit Draft Version for Client Approval
                  </button>
                </div>
              )}

            <div className="space-y-3">
              {collaboration.legalDrafts.map((d) => (
                <div key={d.versionId} className="rounded-lg border border-slate-200 p-3.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-slate-900">
                      {d.versionId} · {d.title}
                    </span>
                    <span
                      className={`font-semibold ${
                        d.clientApprovalStatus === 'Approved by client'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {d.clientApprovalStatus}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-slate-700">{d.content}</p>
                  {roleView === 'customer' && d.clientApprovalStatus !== 'Approved by client' && (
                    <div className="mt-2.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onCollaborationAction(matter.matterId, 'approveDraft', {
                            versionId: d.versionId,
                            status: 'Approved by client',
                          })
                        }
                        className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700"
                      >
                        <Check className="h-3 w-3" /> Approve Draft
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onCollaborationAction(matter.matterId, 'approveDraft', {
                            versionId: d.versionId,
                            status: 'Changes requested',
                          })
                        }
                        className="rounded border border-slate-200 px-2.5 py-1 text-slate-700"
                      >
                        Request Changes
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900">Advocate Missing-Document Requests</h3>
            {roleView === 'advocate' && collaboration.invitationStatus === 'Accepted' && (
              <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                <input
                  type="text"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="Document requested..."
                  className="rounded border border-slate-300 bg-white px-2.5 py-1.5"
                />
                <input
                  type="text"
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="Legal reason why needed..."
                  className="rounded border border-slate-300 bg-white px-2.5 py-1.5"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!reqTitle.trim()) return;
                    await onCollaborationAction(matter.matterId, 'requestDocument', {
                      title: reqTitle.trim(),
                      reason: reqReason.trim(),
                    });
                    setReqTitle('');
                    setReqReason('');
                  }}
                  className="self-start rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white"
                >
                  Send Document Request
                </button>
              </div>
            )}

            {collaboration.documentRequests.map((r) => (
              <div key={r.requestId} className="rounded-lg border border-slate-200 p-3 text-xs">
                <div className="flex justify-between font-medium text-slate-900">
                  <span>{r.title}</span>
                  <span className="font-mono text-slate-500">{r.requestedAt}</span>
                </div>
                <div className="mt-0.5 text-slate-600">{r.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">
          Matter Access & Permission Audit Log ({matterLogs.length})
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 pr-4 font-medium">Timestamp</th>
                <th className="pb-2 pr-4 font-medium">Actor & Role</th>
                <th className="pb-2 pr-4 font-medium">Action</th>
                <th className="pb-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matterLogs.map((l) => (
                <tr key={l.logId}>
                  <td className="py-2 pr-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                    {l.timestamp.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="py-2 pr-4 font-medium text-slate-900 whitespace-nowrap">
                    {l.actor} ({l.role})
                  </td>
                  <td className="py-2 pr-4 text-blue-700 whitespace-nowrap">{l.action}</td>
                  <td className="py-2 text-slate-600">{l.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
