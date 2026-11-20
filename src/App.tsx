import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  CalendarRange,
  FileCheck2,
  FolderLock,
  LayoutDashboard,
  Menu,
  Scale,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { CollaborationView } from './components/CollaborationView.tsx';
import { ComplaintsView } from './components/ComplaintsView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { EvidenceVaultView } from './components/EvidenceVaultView.tsx';
import { LegalSourcesView } from './components/LegalSourcesView.tsx';
import { MatterRegistrationModal } from './components/MatterRegistrationModal.tsx';
import { MatterReportView } from './components/MatterReportView.tsx';
import { MattersView } from './components/MattersView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { StartupEngineView } from './components/StartupEngineView.tsx';
import { TimelineView } from './components/TimelineView.tsx';
import type {
  AppDatabase,
  BankComplaint,
  BankingMatter,
  EvidenceDocument,
  LegalClassificationCategory,
  MatterStatus,
  OmbudsmanEligibilityCheck,
  StartupEngineProject,
  TimelineEvent,
  UserRoleView,
  UserSettings,
  VerificationStatus,
} from './types.ts';

type NavTab =
  | 'dashboard'
  | 'matters'
  | 'evidence'
  | 'timeline'
  | 'complaints'
  | 'legal-sources'
  | 'report'
  | 'collaboration'
  | 'startup-engine'
  | 'settings';

const NAV_ITEMS: { id: NavTab; label: string; group: 'matter' | 'platform'; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', group: 'matter', icon: LayoutDashboard },
  { id: 'matters', label: 'Matters & Issues', group: 'matter', icon: FolderLock },
  { id: 'evidence', label: 'Evidence Vault', group: 'matter', icon: ShieldCheck },
  { id: 'timeline', label: 'Timeline', group: 'matter', icon: CalendarRange },
  { id: 'complaints', label: 'Bank Complaints', group: 'matter', icon: Scale },
  { id: 'legal-sources', label: 'Legal Sources', group: 'matter', icon: BookOpen },
  { id: 'report', label: 'Matter Report', group: 'matter', icon: FileCheck2 },
  { id: 'collaboration', label: 'Professional Review', group: 'matter', icon: Users },
  { id: 'startup-engine', label: 'LLB Startup Engine', group: 'platform', icon: Sparkles },
  { id: 'settings', label: 'Settings', group: 'platform', icon: Settings },
];

export default function App() {
  const [db, setDb] = useState<AppDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedMatterId, setSelectedMatterId] = useState<string>('BM-2026-00001');
  const [roleView, setRoleView] = useState<UserRoleView>('customer');
  const [newMatterOpen, setNewMatterOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const fetchState = useCallback(async (role: UserRoleView = roleView) => {
    try {
      const res = await fetch(`/api/state?role=${role}`);
      if (!res.ok) throw new Error('Failed to load workspace data');
      const data = (await res.json()) as AppDatabase;
      setDb(data);
      setSelectedMatterId((prev) =>
        data.matters.some((m) => m.matterId === prev)
          ? prev
          : data.matters[0]?.matterId || ''
      );
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach server');
    } finally {
      setLoading(false);
    }
  }, [roleView]);

  useEffect(() => {
    fetchState(roleView);
  }, [fetchState, roleView]);

  async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data as T;
  }

  async function handleCreateMatter(payload: Partial<BankingMatter>) {
    const created = await apiJson<BankingMatter>('/api/matters', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await fetchState();
    setSelectedMatterId(created.matterId);
    setActiveTab('matters');
  }

  async function handleUpdateStatus(matterId: string, status: MatterStatus) {
    await apiJson(`/api/matters/${matterId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await fetchState();
  }

  async function handleAnalyzeMatter(matterId: string) {
    await apiJson('/api/ai/analyze-matter', {
      method: 'POST',
      body: JSON.stringify({ matterId }),
    });
    await fetchState();
  }

  async function handleOverrideIssue(
    matterId: string,
    issueId: string,
    classification: LegalClassificationCategory,
    reason: string
  ) {
    await apiJson(`/api/matters/${matterId}/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify({ classification, userOverrideReason: reason }),
    });
    await fetchState();
  }

  async function handleUploadEvidence(matterId: string, payload: Record<string, unknown>) {
    await apiJson(`/api/matters/${matterId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await fetchState();
  }

  async function handleUpdateEvidence(
    matterId: string,
    evidenceId: string,
    payload: Partial<EvidenceDocument>
  ) {
    await apiJson(`/api/matters/${matterId}/evidence/${evidenceId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    await fetchState();
  }

  async function handleRunOcr(matterId: string, evidenceId: string) {
    await apiJson('/api/ai/extract-evidence', {
      method: 'POST',
      body: JSON.stringify({ matterId, evidenceId }),
    });
    await fetchState();
  }

  async function handleVerifyFact(
    matterId: string,
    factId: string,
    verificationStatus: VerificationStatus,
    userCorrectionNote?: string
  ) {
    await apiJson(`/api/matters/${matterId}/facts/${factId}`, {
      method: 'PATCH',
      body: JSON.stringify({ verificationStatus, userCorrectionNote }),
    });
    await fetchState();
  }

  async function handleAddEvent(matterId: string, event: Partial<TimelineEvent>) {
    await apiJson(`/api/matters/${matterId}/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
    await fetchState();
  }

  async function handleAddComplaint(matterId: string, payload: Partial<BankComplaint>) {
    await apiJson(`/api/matters/${matterId}/complaints`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await fetchState();
  }

  async function handleRunOmbudsmanCheck(
    matterId: string,
    payload: {
      complaintDate?: string;
      bankResponse?: string;
      bankResponseDate?: string;
      hasWrittenProof: boolean;
      pendingInCourt: boolean;
      commercialJudgmentOnly: boolean;
    }
  ): Promise<OmbudsmanEligibilityCheck> {
    const res = await apiJson<OmbudsmanEligibilityCheck>(
      `/api/matters/${matterId}/ombudsman-check`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    await fetchState();
    return res;
  }

  async function handleDraftComplaint(
    matterId: string,
    target: 'Bank Grievance Redressal Officer' | 'RBI Integrated Ombudsman (CMS)'
  ) {
    await apiJson('/api/ai/draft-complaint', {
      method: 'POST',
      body: JSON.stringify({ matterId, target }),
    });
    await fetchState();
  }

  async function handleCollaborationAction(
    matterId: string,
    action: string,
    payload: Record<string, unknown>
  ) {
    await apiJson(`/api/matters/${matterId}/collaboration`, {
      method: 'POST',
      body: JSON.stringify({ action, payload }),
    });
    await fetchState();
  }

  async function handleGenerateStartup(
    subjectName: string,
    syllabusInput: string
  ): Promise<StartupEngineProject> {
    const project = await apiJson<StartupEngineProject>('/api/ai/startup-engine', {
      method: 'POST',
      body: JSON.stringify({ subjectName, syllabusInput }),
    });
    await fetchState();
    return project;
  }

  async function handleSaveSettings(payload: Partial<UserSettings>) {
    await apiJson('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    await fetchState();
  }

  async function handleResetDemo() {
    await apiJson('/api/reset-demo', { method: 'POST' });
    await fetchState();
  }

  const selectedMatter =
    db?.matters.find((m) => m.matterId === selectedMatterId) || db?.matters[0];

  const activeNavLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label || 'Dashboard';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md space-y-3 rounded-xl border border-slate-200 bg-white p-6">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!db || !selectedMatter) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700">
          {error || 'Unable to initialize Dakshakriti workspace.'}
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white">
      <div>
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Dakshakriti
          </span>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-lg p-1 text-slate-500 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Active Matter Context Picker */}
        <div className="border-b border-slate-200 p-4">
          <label className="mb-1 block text-[11px] font-medium text-slate-500">
            Active Banking Matter
          </label>
          <select
            value={selectedMatter.matterId}
            onChange={(e) => setSelectedMatterId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
          >
            {db.matters.map((m) => (
              <option key={m.matterId} value={m.matterId}>
                {m.matterId} · ₹{m.transaction.amountInr.toLocaleString('en-IN')}
              </option>
            ))}
          </select>
          <div className="mt-1.5 truncate text-[11px] text-slate-500">
            {selectedMatter.category}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-5 p-3">
          <div>
            <div className="px-2.5 pb-1.5 text-[11px] font-medium text-slate-400">
              Banking Matter OS
            </div>
            <div className="space-y-0.5">
              {NAV_ITEMS.filter((i) => i.group === 'matter').map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="px-2.5 pb-1.5 text-[11px] font-medium text-slate-400">
              Universal Engine
            </div>
            <div className="space-y-0.5">
              {NAV_ITEMS.filter((i) => i.group === 'platform').map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* Quiet Attribution Footer */}
      <div className="border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">
        <div>Dakshakriti Legal-Tech</div>
        <div>Founder: Deepak Sharma</div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 w-64 border-r border-slate-200 bg-white">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar Contract: Left Breadcrumb — Right 1-2 Actions */}
        <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 truncate text-xs text-slate-500">
              <span className="font-medium text-slate-900">Dakshakriti</span>
              <span aria-hidden="true">/</span>
              <span>{activeTab === 'startup-engine' || activeTab === 'settings' ? 'Universal Engine' : 'Banking Matter OS'}</span>
              <span aria-hidden="true">/</span>
              <span className="font-medium text-slate-900">{activeNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className="hidden rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex whitespace-nowrap shrink-0"
            >
              Matter Report
            </button>
            <button
              type="button"
              onClick={() => setNewMatterOpen(true)}
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              New Matter
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 p-4 lg:p-8">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              db={db}
              selectedMatter={selectedMatter}
              onSelectMatter={setSelectedMatterId}
              onNavigate={(tab) => setActiveTab(tab as NavTab)}
              onOpenNewMatter={() => setNewMatterOpen(true)}
            />
          )}

          {activeTab === 'matters' && (
            <MattersView
              db={db}
              selectedMatter={selectedMatter}
              onSelectMatter={setSelectedMatterId}
              onOpenNewMatter={() => setNewMatterOpen(true)}
              onAnalyzeMatter={handleAnalyzeMatter}
              onUpdateStatus={handleUpdateStatus}
              onOverrideIssue={handleOverrideIssue}
              onNavigate={(tab) => setActiveTab(tab as NavTab)}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceVaultView
              matter={selectedMatter}
              roleView={roleView}
              onUploadEvidence={handleUploadEvidence}
              onUpdateEvidence={handleUpdateEvidence}
              onRunOcr={handleRunOcr}
              onVerifyFact={handleVerifyFact}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineView matter={selectedMatter} onAddEvent={handleAddEvent} />
          )}

          {activeTab === 'complaints' && (
            <ComplaintsView
              matter={selectedMatter}
              onAddComplaint={handleAddComplaint}
              onRunOmbudsmanCheck={handleRunOmbudsmanCheck}
              onDraftComplaint={handleDraftComplaint}
            />
          )}

          {activeTab === 'legal-sources' && <LegalSourcesView db={db} />}

          {activeTab === 'report' && <MatterReportView matter={selectedMatter} />}

          {activeTab === 'collaboration' && (
            <CollaborationView
              matter={selectedMatter}
              roleView={roleView}
              auditLogs={db.auditLogs}
              onRoleSwitch={(nextRole) => setRoleView(nextRole)}
              onCollaborationAction={handleCollaborationAction}
            />
          )}

          {activeTab === 'startup-engine' && (
            <StartupEngineView db={db} onGenerateStartup={handleGenerateStartup} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              db={db}
              onSaveSettings={handleSaveSettings}
              onResetDemo={handleResetDemo}
            />
          )}
        </main>
      </div>

      <MatterRegistrationModal
        open={newMatterOpen}
        onClose={() => setNewMatterOpen(false)}
        onCreate={handleCreateMatter}
      />
    </div>
  );
}
