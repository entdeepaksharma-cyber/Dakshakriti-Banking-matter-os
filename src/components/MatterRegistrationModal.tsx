import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { BANK_CATEGORIES, BANKING_PROBLEM_CATEGORIES } from '../data/seedData.ts';
import type { BankCategory, BankingMatter, BankingProblemCategory, MatterStatus } from '../types.ts';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: Partial<BankingMatter>) => Promise<void>;
}

export function MatterRegistrationModal({ open, onClose, onCreate }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [category, setCategory] = useState<BankingProblemCategory>('Unauthorised electronic transactions');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<MatterStatus>('Open');

  const [customerName, setCustomerName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [customerType, setCustomerType] = useState<'Individual' | 'Business'>('Individual');
  const [cityState, setCityState] = useState('');

  const [bankName, setBankName] = useState('');
  const [bankCategory, setBankCategory] = useState<BankCategory>('Commercial Bank');
  const [branch, setBranch] = useState('');
  const [accountType, setAccountType] = useState('Savings Bank Account');
  const [accountReference, setAccountReference] = useState('');
  const [customerRelationship, setCustomerRelationship] = useState('Account Holder');

  const [transactionDate, setTransactionDate] = useState('2026-11-10');
  const [amountInr, setAmountInr] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [transactionType, setTransactionType] = useState('Debit');
  const [paymentMethod, setPaymentMethod] = useState('UPI / Electronic Transfer');

  const [whatHappened, setWhatHappened] = useState('');
  const [customerExpected, setCustomerExpected] = useState('');
  const [whatActuallyHappened, setWhatActuallyHappened] = useState('');
  const [discoveredDate, setDiscoveredDate] = useState('2026-11-10');
  const [bankContacted, setBankContacted] = useState(true);
  const [initialResponseReceived, setInitialResponseReceived] = useState('');

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !bankName.trim() || !whatHappened.trim()) {
      setError('Customer name, bank name, and factual summary of what happened are required.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim() || `${category} — ${bankName.trim()}`,
        category,
        status,
        customer: {
          name: customerName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          customerType,
          cityState: cityState.trim(),
        },
        bank: {
          bankName: bankName.trim(),
          bankCategory,
          branch: branch.trim(),
          accountType,
          accountReference: accountReference.trim() || 'XXXX-0000',
          customerRelationship,
        },
        transaction: {
          transactionDate,
          amountInr: Number(amountInr) || 0,
          transactionReference: transactionReference.trim(),
          transactionType,
          paymentMethod,
        },
        problem: {
          whatHappened: whatHappened.trim(),
          customerExpected: customerExpected.trim(),
          whatActuallyHappened: whatActuallyHappened.trim(),
          discoveredDate,
          bankContacted,
          initialResponseReceived: initialResponseReceived.trim(),
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register banking matter.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Register New Banking Matter</h2>
            <p className="text-xs text-slate-500">
              Creates a structured matter record (BM-2026-XXXXX) with date-sensitive RBI applicability.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <p>
              Security Policy: Never enter netbanking passwords, ATM PINs, OTPs, or full card CVV numbers. Use masked account references (e.g. SB-XXXX-4821) only.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Core Classification */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Banking Problem Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BankingProblemCategory)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {BANKING_PROBLEM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MatterStatus)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="Open">Open</option>
                <option value="Under review">Under review</option>
                <option value="Complaint filed">Complaint filed</option>
                <option value="Professional review">Professional review</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">Matter Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Unauthorised electronic debit of ₹25,000 from Savings Account"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* A. Customer Details */}
          <div className="border-t border-slate-200 pt-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">A. Customer Details</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full legal name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Customer Type</label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value as 'Individual' | 'Business')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                >
                  <option value="Individual">Individual</option>
                  <option value="Business">Business</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">City & State</label>
                <input
                  type="text"
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  placeholder="e.g., Jaipur, Rajasthan"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@example.in"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91-98XXXXXXXX"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* B. Bank Details */}
          <div className="border-t border-slate-200 pt-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">B. Bank & Account Details</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Bank / Regulated Entity *</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Bank or NBFC name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Entity Category (Ombudsman & RBI Scope)
                </label>
                <select
                  value={bankCategory}
                  onChange={(e) => setBankCategory(e.target.value as BankCategory)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                >
                  {BANK_CATEGORIES.map((bc) => (
                    <option key={bc} value={bc}>
                      {bc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Branch name / city"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Account Type</label>
                <input
                  type="text"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  placeholder="Savings / Current / Loan / Credit Card"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Masked Account Ref</label>
                <input
                  type="text"
                  value={accountReference}
                  onChange={(e) => setAccountReference(e.target.value)}
                  placeholder="SB-XXXX-4821"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Customer Relationship</label>
                <input
                  type="text"
                  value={customerRelationship}
                  onChange={(e) => setCustomerRelationship(e.target.value)}
                  placeholder="Account Holder / Borrower / Guarantor"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* C. Transaction Details */}
          <div className="border-t border-slate-200 pt-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              C. Transaction Details (Controls Date-Sensitive RBI Rule Applicability)
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Transaction Date *</label>
                <input
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Disputed Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountInr}
                  onChange={(e) => setAmountInr(e.target.value)}
                  placeholder="25000"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Transaction Reference / UTR</label>
                <input
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="UTR-631510984412"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Transaction Type</label>
                <input
                  type="text"
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  placeholder="Debit / Charge / Cheque / Lien"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">Payment Method</label>
                <input
                  type="text"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="UPI / NEFT / RTGS / IMPS / ATM / Debit Card / Cheque"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* D. Problem Details */}
          <div className="border-t border-slate-200 pt-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">D. Factual Problem Narrative</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">What happened? *</label>
                <textarea
                  required
                  rows={2}
                  value={whatHappened}
                  onChange={(e) => setWhatHappened(e.target.value)}
                  placeholder="Factual description of the banking problem..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    What did the customer expect?
                  </label>
                  <textarea
                    rows={2}
                    value={customerExpected}
                    onChange={(e) => setCustomerExpected(e.target.value)}
                    placeholder="Expected banking duty / reversal / mandate handling..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    What actually happened?
                  </label>
                  <textarea
                    rows={2}
                    value={whatActuallyHappened}
                    onChange={(e) => setWhatActuallyHappened(e.target.value)}
                    placeholder="Actual outcome or omission..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Date Discovered</label>
                  <input
                    type="date"
                    value={discoveredDate}
                    onChange={(e) => setDiscoveredDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Bank Contacted?</label>
                  <select
                    value={bankContacted ? 'yes' : 'no'}
                    onChange={(e) => setBankContacted(e.target.value === 'yes')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  >
                    <option value="yes">Yes — Bank contacted</option>
                    <option value="no">No — Not yet contacted</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Response Received</label>
                  <input
                    type="text"
                    value={initialResponseReceived}
                    onChange={(e) => setInitialResponseReceived(e.target.value)}
                    placeholder="Summary of bank reply if any"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? 'Registering Matter...' : 'Register Banking Matter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
