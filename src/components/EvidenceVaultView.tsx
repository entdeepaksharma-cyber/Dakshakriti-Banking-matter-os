import React, { useState } from 'react';
import {
  Check,
  Cpu,
  Download,
  Eye,
  FileText,
  ShieldAlert,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { EVIDENCE_CATEGORIES } from '../data/seedData.ts';
import type {
  BankingMatter,
  DocumentOriginType,
  DocumentSourceParty,
  EvidenceCategory,
  EvidenceDocument,
  UserRoleView,
  VerificationStatus,
} from '../types.ts';

interface Props {
  matter: BankingMatter;
  roleView: UserRoleView;
  onUploadEvidence: (matterId: string, payload: Record<string, unknown>) => Promise<void>;
  onUpdateEvidence: (
    matterId: string,
    evidenceId: string,
    payload: Partial<EvidenceDocument>
  ) => Promise<void>;
  onRunOcr: (matterId: string, evidenceId: string) => Promise<void>;
  onVerifyFact: (
    matterId: string,
    factId: string,
    status: VerificationStatus,
    correctionNote?: string
  ) => Promise<void>;
}

export function EvidenceVaultView({
  matter,
  roleView,
  onUploadEvidence,
  onUpdateEvidence,
  onRunOcr,
  onVerifyFact,
}: Props) {
  const [showUpload, setShowUpload] = useState(false);
  const [docName, setDocName] = useState('');
  const [category, setCategory] = useState<EvidenceCategory>('Bank statements');
  const [documentDate, setDocumentDate] = useState('2026-11-10');
  const [source, setSource] = useState<DocumentSourceParty>('Bank');
  const [originType, setOriginType] = useState<DocumentOriginType>('Original');
  const [description, setDescription] = useState('');
  const [missingPages, setMissingPages] = useState('');
  const [textContent, setTextContent] = useState('');
  const [base64Data, setBase64Data] = useState('');
  const [mimeType, setMimeType] = useState('text/plain');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [viewingDoc, setViewingDoc] = useState<EvidenceDocument | null>(null);
  const [ocrLoadingId, setOcrLoadingId] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState('');

  const [editNotes, setEditNotes] = useState('');
  const [editMissing, setEditMissing] = useState('');

  const canUpload =
    roleView === 'customer' ||
    (matter.collaboration.invitationStatus === 'Accepted' &&
      matter.collaboration.permissions.uploadAdditionalEvidence);

  const canDownload =
    roleView === 'customer' ||
    (matter.collaboration.invitationStatus === 'Accepted' &&
      matter.collaboration.permissions.downloadDocuments);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocName(file.name);
    setMimeType(file.type || 'application/octet-stream');

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setBase64Data(result);
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const textReader = new FileReader();
        textReader.onload = () => setTextContent(String(textReader.result || ''));
        textReader.readAsText(file);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!docName.trim() && !textContent.trim()) {
      setUploadError('Select a file (PDF, JPG, PNG, DOC/DOCX, XLS/XLSX, TXT) or paste text.');
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      await onUploadEvidence(matter.matterId, {
        documentName: docName.trim() || `Evidence_${Date.now()}.txt`,
        category,
        documentDate,
        source,
        originType,
        mimeType,
        base64Data,
        textContent,
        description,
        missingOrUnclearPages: missingPages || 'None reported',
        actor: roleView === 'advocate' ? matter.collaboration.invitedAdvocateName : matter.customer.name,
        role: roleView === 'advocate' ? 'Advocate' : 'Customer',
      });
      setShowUpload(false);
      setDocName('');
      setTextContent('');
      setBase64Data('');
      setDescription('');
      setMissingPages('');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function triggerOcr(evidenceId: string) {
    setOcrError('');
    setOcrLoadingId(evidenceId);
    try {
      await onRunOcr(matter.matterId, evidenceId);
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'AI extraction failed.');
    } finally {
      setOcrLoadingId(null);
    }
  }

  function openViewer(doc: EvidenceDocument) {
    setViewingDoc(doc);
    setEditNotes(doc.notes || '');
    setEditMissing(doc.missingOrUnclearPages || '');
  }

  return (
    <div className="space-y-6">
      {/* Header & Upload Trigger */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Evidence Vault · {matter.matterId}
          </h2>
          <p className="text-xs text-slate-500">
            Preserves original uploaded files untouched. Upload date is tracked separately from document creation date.
          </p>
        </div>
        {canUpload && (
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <Upload className="h-4 w-4" />
            {showUpload ? 'Close Upload Form' : 'Upload Evidence Document'}
          </button>
        )}
      </div>

      {ocrError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {ocrError}
        </div>
      )}

      {/* Upload Form */}
      {showUpload && (
        <form
          onSubmit={handleUploadSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
        >
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <span>
              Supported formats: PDF, JPG, JPEG, PNG, DOC, DOCX, XLS, XLSX, TXT. Never upload files containing netbanking passwords, PINs, OTPs, or CVVs.
            </span>
          </div>

          {uploadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {uploadError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Select File (PDF, Image, Office, TXT)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
                onChange={handleFileChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Evidence Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EvidenceCategory)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                {EVIDENCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Document Name
              </label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g., Nov_Statement.pdf or SMS_Alert.png"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Document Date (Date appearing on record)
              </label>
              <input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Source Party</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as DocumentSourceParty)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs"
                >
                  <option value="Bank">Bank</option>
                  <option value="Customer">Customer</option>
                  <option value="Third party">Third party</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Origin Type</label>
                <select
                  value={originType}
                  onChange={(e) => setOriginType(e.target.value as DocumentOriginType)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs"
                >
                  <option value="Original">Original</option>
                  <option value="Copy">Copy</option>
                  <option value="Screenshot">Screenshot</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Short Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this record shows..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Missing / Unclear Pages (if any)
              </label>
              <input
                type="text"
                value={missingPages}
                onChange={(e) => setMissingPages(e.target.value)}
                placeholder="e.g., Page 3 missing or timestamp cropped"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Or Paste SMS / Email / Statement Text Directly (Optional for AI-OCR)
            </label>
            <textarea
              rows={3}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste exact SMS alert, bank email text, or complaint acknowledgement text..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {uploading ? 'Preserving File...' : 'Save to Evidence Vault'}
            </button>
          </div>
        </form>
      )}

      {/* Evidence Records Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-900">
            Preserved Evidence Records ({matter.evidence.length})
          </h3>
        </div>
        {matter.evidence.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No evidence documents accessible in this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500">
                  <th className="px-4 py-3 font-medium">Evidence ID</th>
                  <th className="px-4 py-3 font-medium">Document & Category</th>
                  <th className="px-4 py-3 font-medium">Doc Date / Upload Date</th>
                  <th className="px-4 py-3 font-medium">Source & Origin</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matter.evidence.map((doc) => (
                  <tr key={doc.evidenceId} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {doc.evidenceId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{doc.documentName}</div>
                      <div className="text-slate-500">
                        {doc.category} · {doc.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      <div>Doc: {doc.documentDate}</div>
                      <div className="text-slate-400">Up: {doc.uploadDate}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {doc.source} · {doc.originType}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          doc.verificationStatus === 'Reviewed'
                            ? 'text-emerald-700'
                            : doc.verificationStatus === 'Disputed'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {doc.verificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openViewer(doc)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerOcr(doc.evidenceId)}
                          disabled={ocrLoadingId === doc.evidenceId}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                        >
                          <Cpu className="h-3.5 w-3.5" />
                          {ocrLoadingId === doc.evidenceId ? 'Extracting...' : 'Extract Facts'}
                        </button>
                        {canDownload && (
                          <a
                            href={`/api/matters/${matter.matterId}/evidence/${doc.evidenceId}/file?download=1&role=${roleView}`}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                            title="Download original file"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Extracted Fact Verification Ledger */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">
            Extracted Fact Verification Screen ({matter.extractedFacts.length})
          </h3>
          <p className="text-xs text-slate-500">
            AI-extracted facts remain marked Pending until verified by the user against the original source document. User verification records confirmation, not independent legal truth.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {matter.extractedFacts.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No extracted facts yet. Click "Extract Facts" on any uploaded document above.
            </div>
          ) : (
            matter.extractedFacts.map((fact) => (
              <div
                key={fact.factId}
                className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-900">{fact.factId}</span>
                    <span>·</span>
                    <span>{fact.factType}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">{fact.date}</span>
                    {fact.amountInr !== undefined && (
                      <>
                        <span>·</span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          ₹{fact.amountInr.toLocaleString('en-IN')}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span>
                      Source: {fact.sourceDocumentId} ({fact.pageOrReference})
                    </span>
                    <span>·</span>
                    <span>Method: {fact.extractionMethod}</span>
                  </div>
                  <div className="text-sm text-slate-900">{fact.description}</div>
                  <div className="text-xs text-slate-500">
                    Label: <span className="font-medium">{fact.confidenceLabel}</span> · Status:{' '}
                    <span
                      className={`font-semibold ${
                        fact.verificationStatus === 'Verified'
                          ? 'text-emerald-700'
                          : fact.verificationStatus === 'Disputed'
                          ? 'text-red-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {fact.verificationStatus}
                    </span>
                  </div>
                </div>
                {roleView === 'customer' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onVerifyFact(matter.matterId, fact.factId, 'Verified')}
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      <Check className="h-3.5 w-3.5" /> Verify
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onVerifyFact(
                          matter.matterId,
                          fact.factId,
                          'Disputed',
                          'Contested against original record'
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Dispute
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-slate-900">
                    {viewingDoc.evidenceId}
                  </span>
                  <span>·</span>
                  <span>{viewingDoc.category}</span>
                  <span>·</span>
                  <span>{viewingDoc.originType}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{viewingDoc.documentName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-12">
              <div className="border-b border-slate-200 bg-slate-50 p-5 md:col-span-7 md:border-b-0 md:border-r">
                {viewingDoc.mimeType.startsWith('image/') && viewingDoc.storageFileName ? (
                  <img
                    src={`/api/matters/${matter.matterId}/evidence/${viewingDoc.evidenceId}/file?role=${roleView}`}
                    alt={viewingDoc.documentName}
                    referrerPolicy="no-referrer"
                    className="max-h-[60vh] w-full rounded-lg border border-slate-200 object-contain bg-white"
                  />
                ) : viewingDoc.mimeType === 'application/pdf' && viewingDoc.storageFileName ? (
                  <iframe
                    src={`/api/matters/${matter.matterId}/evidence/${viewingDoc.evidenceId}/file?role=${roleView}`}
                    title={viewingDoc.documentName}
                    className="h-[60vh] w-full rounded-lg border border-slate-200 bg-white"
                  />
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <FileText className="h-4 w-4" /> Preserved Document Text / Record Body
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-800">
                      {viewingDoc.textContent || 'Binary office document preserved on server. Use Download button to open original file.'}
                    </pre>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-5 md:col-span-5">
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-slate-500">Document Date:</span>{' '}
                    <span className="font-mono text-slate-900">{viewingDoc.documentDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Upload Date:</span>{' '}
                    <span className="font-mono text-slate-900">{viewingDoc.uploadDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Source:</span> {viewingDoc.source} ({viewingDoc.originType})
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Verification Status
                  </label>
                  <select
                    value={viewingDoc.verificationStatus}
                    onChange={async (e) => {
                      const val = e.target.value as EvidenceDocument['verificationStatus'];
                      await onUpdateEvidence(matter.matterId, viewingDoc.evidenceId, {
                        verificationStatus: val,
                      });
                      setViewingDoc({ ...viewingDoc, verificationStatus: val });
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                  >
                    <option value="Unreviewed">Unreviewed</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Disputed">Disputed</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Missing or Unclear Pages
                  </label>
                  <input
                    type="text"
                    value={editMissing}
                    onChange={(e) => setEditMissing(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Observations & Annotations (Stored Separately from Original File)
                  </label>
                  <textarea
                    rows={4}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await onUpdateEvidence(matter.matterId, viewingDoc.evidenceId, {
                        notes: editNotes,
                        missingOrUnclearPages: editMissing,
                      });
                      setViewingDoc(null);
                    }}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    Save Annotations
                  </button>
                  {canDownload && (
                    <a
                      href={`/api/matters/${matter.matterId}/evidence/${viewingDoc.evidenceId}/file?download=1&role=${roleView}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Original
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
