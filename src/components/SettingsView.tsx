import React, { useState } from 'react';
import { RefreshCw, Shield, UserCheck } from 'lucide-react';
import type { AppDatabase, UserSettings } from '../types.ts';

interface Props {
  db: AppDatabase;
  onSaveSettings: (payload: Partial<UserSettings>) => Promise<void>;
  onResetDemo: () => Promise<void>;
}

const PLANS: {
  name: UserSettings['activePlan'];
  audience: string;
  price: string;
  limits: string;
}[] = [
  {
    name: 'Basic Consumer (Free)',
    audience: 'For individual bank customers',
    price: 'Free (Proposed)',
    limits: '1 active matter · Evidence preservation · Basic chronology & GRO draft',
  },
  {
    name: 'Consumer Plus (₹99–₹199/mo)',
    audience: 'For active multi-dispute consumers',
    price: '₹99–₹199/month (Test Price)',
    limits: 'Unlimited matters · AI-OCR extraction · Full 2026 Ombudsman dossier & exports',
  },
  {
    name: 'Lawyer Workspace (₹499–₹999/mo)',
    audience: 'For independent advocates',
    price: '₹499–₹999/month (Test Price)',
    limits: 'Client-invited matter review · Confidential work-product notes · Draft versioning',
  },
  {
    name: 'Institutional Licence',
    audience: 'For consumer orgs & legal clinics',
    price: 'Custom Annual Licence',
    limits: 'Multi-matter administration · Custom LLB subject configurations · Audit exports',
  },
];

export function SettingsView({ db, onSaveSettings, onResetDemo }: Props) {
  const [settings, setSettings] = useState<UserSettings>(db.settings);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedNotice('');
    try {
      await onSaveSettings(settings);
      setSavedNotice('Settings saved and recorded in audit log.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Founder & Platform Architecture Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Dakshakriti Platform Governance & Settings</h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Founded by <strong>Deepak Sharma</strong> · Universal LLB Startup Engine & Banking Matter OS (V1.0–V2.0).
            </p>
          </div>
          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Restore Illustrative Dataset
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Profile & Advocate Verification */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UserCheck className="h-4 w-4 text-blue-700" />
            Account & Advocate Credentials
          </h3>

          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium text-slate-700">Account Name</label>
              <input
                type="text"
                value={settings.accountName}
                onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-slate-700">Advocate Profile Name</label>
              <input
                type="text"
                value={settings.advocateProfile.fullName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    advocateProfile: { ...settings.advocateProfile, fullName: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-slate-700">Bar Enrolment Number</label>
              <input
                type="text"
                value={settings.advocateProfile.enrolmentNumber}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    advocateProfile: { ...settings.advocateProfile, enrolmentNumber: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
              />
            </div>
          </div>

          {/* Software Tiers */}
          <div className="border-t border-slate-100 pt-4">
            <div className="mb-2 text-xs font-semibold text-slate-900">
              Software Subscription Model (Proposed Test Pricing · Independent of Legal Fees)
            </div>
            <div className="space-y-2">
              {PLANS.map((plan) => (
                <label
                  key={plan.name}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-xs ${
                    settings.activePlan === plan.name
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    checked={settings.activePlan === plan.name}
                    onChange={() => setSettings({ ...settings, activePlan: plan.name })}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap justify-between gap-2 font-semibold text-slate-900">
                      <span>{plan.name}</span>
                      <span className="font-mono text-blue-700">{plan.price}</span>
                    </div>
                    <div className="text-slate-500">{plan.audience} — {plan.limits}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* DPDP Act 2023 & Security Controls */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Shield className="h-4 w-4 text-blue-700" />
            DPDP Act, 2023 & Rules, 2025 Compliance Controls
          </h3>
          <p className="text-xs leading-relaxed text-slate-600">
            As of 20 November 2026, principal processing obligations under ss. 3–17 of the DPDP Act, 2023 commence on 13 May 2027 (18 months from 13 Nov 2025). Dakshakriti embeds privacy-by-design controls from launch: clear consent notice, purpose limitation, data minimisation, retention controls, and prohibition on collecting PINs/OTPs/CVVs/passwords.
          </p>

          <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <input
              type="checkbox"
              checked={settings.dpdpConsentAccepted}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  dpdpConsentAccepted: e.target.checked,
                  dpdpConsentTimestamp: new Date().toISOString(),
                })
              }
              className="mt-0.5"
            />
            <span>
              <strong>Informed Data-Principal Consent:</strong> Consent recorded for storing banking dispute documents strictly for matter organisation, chronology building, and user-authorised advocate sharing.
            </span>
          </label>

          <div className="text-xs">
            <label className="mb-1 block font-medium text-slate-700">
              Document Retention Policy (Days after Matter Closure)
            </label>
            <select
              value={settings.dataRetentionDays}
              onChange={(e) =>
                setSettings({ ...settings, dataRetentionDays: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
            >
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>365 days (1 year)</option>
              <option value={1095}>1,095 days (3 years — Limitation reference)</option>
            </select>
          </div>

          {savedNotice && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              {savedNotice}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            {saving ? 'Saving Settings...' : 'Save Compliance & Account Settings'}
          </button>
        </div>
      </form>

      {/* Platform-wide Security & Activity Audit Log */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">
          Platform Security & Access Audit Trail ({db.auditLogs.length})
        </h3>
        <div className="mt-3 max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 pr-4 font-medium">Log ID</th>
                <th className="pb-2 pr-4 font-medium">Timestamp</th>
                <th className="pb-2 pr-4 font-medium">Actor</th>
                <th className="pb-2 pr-4 font-medium">Matter</th>
                <th className="pb-2 pr-4 font-medium">Action</th>
                <th className="pb-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.auditLogs.map((log) => (
                <tr key={log.logId}>
                  <td className="py-2 pr-4 font-mono text-slate-500">{log.logId}</td>
                  <td className="py-2 pr-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                    {log.timestamp.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="py-2 pr-4 font-medium text-slate-900 whitespace-nowrap">
                    {log.actor} ({log.role})
                  </td>
                  <td className="py-2 pr-4 font-mono text-slate-700">{log.matterId || 'Platform'}</td>
                  <td className="py-2 pr-4 text-blue-700 whitespace-nowrap">{log.action}</td>
                  <td className="py-2 text-slate-600">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
