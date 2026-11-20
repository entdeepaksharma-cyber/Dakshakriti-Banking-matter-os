export type UserRoleView = 'customer' | 'advocate';

export type BankingProblemCategory =
  | 'Unauthorised electronic transactions'
  | 'Failed UPI, NEFT, RTGS or IMPS transactions'
  | 'ATM cash withdrawal disputes'
  | 'Debit or credit card disputes'
  | 'Incorrect bank charges'
  | 'Loan and interest disputes'
  | 'Cheque dishonour disputes'
  | 'Account freezing or debit restrictions'
  | 'Wrongful lien or set-off disputes'
  | 'Deposit maturity and premature withdrawal disputes'
  | 'Banking confidentiality and disclosure disputes'
  | 'Fraud-related banking complaints'
  | 'Other banking disputes';

export type BankCategory =
  | 'Commercial Bank'
  | 'Regional Rural Bank'
  | 'Cooperative Bank'
  | 'Qualifying NBFC'
  | 'Non-Bank PPI Issuer'
  | 'Credit Information Company'
  | 'Other / Unregulated Entity';

export type MatterStatus =
  | 'Open'
  | 'Under review'
  | 'Complaint filed'
  | 'Professional review'
  | 'Closed';

export type EvidenceCategory =
  | 'Bank statements'
  | 'Cheques'
  | 'Payment receipts'
  | 'SMS messages'
  | 'Emails'
  | 'Account-opening forms'
  | 'Account mandates'
  | 'Loan agreements'
  | 'Security documents'
  | 'Bank notices'
  | 'Complaint acknowledgements'
  | 'Bank replies'
  | 'Screenshots'
  | 'Other relevant documents';

export type VerificationStatus = 'Pending' | 'Verified' | 'Disputed';

export type DocumentOriginType = 'Original' | 'Copy' | 'Screenshot';

export type DocumentSourceParty = 'Bank' | 'Customer' | 'Third party' | 'Other';

export type EventType =
  | 'Transaction'
  | 'Customer communication'
  | 'Bank communication'
  | 'Complaint and escalation'
  | 'Legal or procedural';

export type LegalClassificationCategory =
  | 'Contractual issue'
  | 'Statutory issue'
  | 'RBI regulatory issue'
  | 'Consumer issue'
  | 'Payment-system issue'
  | 'Negotiable instrument issue'
  | 'Security issue'
  | 'Confidentiality issue'
  | 'Procedural issue'
  | 'Criminal-law issue';

export interface CustomerDetails {
  name: string;
  contactEmail: string;
  contactPhone: string;
  customerType: 'Individual' | 'Business';
  cityState: string;
}

export interface BankDetails {
  bankName: string;
  bankCategory: BankCategory;
  branch: string;
  accountType: string;
  accountReference: string; // Masked e.g. XXXX-4821 (never PIN/OTP/CVV/Password)
  customerRelationship: string;
}

export interface TransactionDetails {
  transactionDate: string; // YYYY-MM-DD
  amountInr: number;
  transactionReference: string;
  transactionType: string;
  paymentMethod: string;
}

export interface ProblemDetails {
  whatHappened: string;
  customerExpected: string;
  whatActuallyHappened: string;
  discoveredDate: string;
  bankContacted: boolean;
  initialResponseReceived: string;
}

export interface EvidenceDocument {
  evidenceId: string;
  matterId: string;
  documentName: string;
  category: EvidenceCategory;
  uploadDate: string;
  documentDate: string;
  source: DocumentSourceParty;
  originType: DocumentOriginType;
  mimeType: string;
  fileSize: number;
  storageFileName?: string;
  textContent?: string;
  description: string;
  linkedEventId?: string;
  verificationStatus: 'Unreviewed' | 'Reviewed' | 'Disputed';
  missingOrUnclearPages: string;
  legalRelevance: string;
  notes: string;
  aiProcessed: boolean;
}

export interface ExtractedFact {
  factId: string;
  matterId: string;
  factType: string;
  date: string;
  isEstimatedDate: boolean;
  amountInr?: number;
  description: string;
  sourceDocumentId: string;
  sourceDocumentName: string;
  pageOrReference: string;
  extractionMethod: 'User-entered' | 'AI-OCR' | 'Document-text';
  confidenceLabel: 'Document supported' | 'Preliminary' | 'Requires verification';
  verificationStatus: VerificationStatus;
  userCorrectionNote?: string;
}

export interface TimelineEvent {
  eventId: string;
  matterId: string;
  date: string;
  isEstimatedDate: boolean;
  eventType: EventType;
  title: string;
  description: string;
  linkedEvidenceIds: string[];
  sourceFactIds: string[];
  createdBy: 'Customer' | 'AI-Draft' | 'Advocate';
}

export interface ChronologyVersion {
  versionId: string;
  timestamp: string;
  summary: string;
  eventCount: number;
  changedBy: string;
}

export interface ConsistencyAlert {
  alertId: string;
  issueType:
    | 'Amount mismatch'
    | 'Date mismatch'
    | 'Reference mismatch'
    | 'Incomplete record'
    | 'Chronology requires review'
    | 'Possible duplicate record';
  message: string;
  relatedIds: string[];
  resolved: boolean;
}

export interface MissingInfoQuestion {
  questionId: string;
  question: string;
  whyRelevant: string;
  status: 'Unanswered' | 'Answered' | 'Not applicable';
  answer?: string;
}

export interface MatterLegalIssue {
  issueId: string;
  title: string;
  classification: LegalClassificationCategory;
  isPrimary: boolean;
  preliminarySummary: string;
  statusLabel: 'Preliminary' | 'User-adjusted' | 'Professional review';
  linkedSourceIds: string[];
  linkedFactIds: string[];
  linkedEvidenceIds: string[];
  userOverrideReason?: string;
}

export interface IssueEvidenceMatrixRow {
  legalQuestion: string;
  relevantEvidenceRequired: string;
  status: 'Available' | 'Partial' | 'Missing';
  linkedEvidenceIds: string[];
}

export interface BankComplaint {
  complaintId: string; // Internal CMP-2026-001
  matterId: string;
  bankName: string;
  bankCategory: BankCategory;
  channel: 'Branch' | 'Email' | 'Bank Portal' | 'Phone' | 'Written Post';
  complaintDate: string;
  bankReferenceNumber: string; // Official bank ack number
  category: string;
  status: 'Draft' | 'Submitted' | 'Pending' | 'Resolved' | 'Escalated';
  bankResponse: string;
  bankResponseDate?: string;
  nextAction: string;
  supportingEvidenceIds: string[];
  escalationHistory: {
    date: string;
    stage: string;
    note: string;
  }[];
  ombudsmanSubmittedDate?: string;
  ombudsmanAwardDate?: string;
  ombudsmanAwardReceivedDate?: string;
  outcomeNotes?: string;
}

export interface OmbudsmanEligibilityCheck {
  checkedAt: string;
  ruleVersion: string;
  step1ApproachedBank: boolean;
  step2ResponsePeriodResult: 'Passed 30 days' | 'Dissatisfied with reply' | 'Pending (<30 days)' | 'Unclear';
  step3WithinTimeLimit: boolean;
  step4EntityCovered: boolean;
  step5MaintainabilityFlags: string[];
  preliminaryResult: 'Potentially Eligible (Subject to RBI Scrutiny)' | 'Premature — Wait for Bank Response Window' | 'Maintainability / Coverage Concerns Flagged';
  rationale: string;
}

export interface ComplaintDraft {
  draftId: string;
  target: 'Bank Grievance Redressal Officer' | 'RBI Integrated Ombudsman (CMS)';
  createdAt: string;
  subject: string;
  body: string;
  status: 'Draft template only — unverified' | 'Approved by customer';
}

export interface LawyerPermissionSet {
  viewMatterFacts: boolean;
  viewChronology: boolean;
  viewSelectedDocuments: boolean;
  selectedDocumentIds: string[];
  uploadAdditionalEvidence: boolean;
  addProfessionalComments: boolean;
  prepareLegalDrafts: boolean;
  downloadDocuments: boolean;
  inviteAnotherProfessional: boolean;
}

export interface DocumentRequest {
  requestId: string;
  requestedBy: string;
  requestedAt: string;
  title: string;
  reason: string;
  status: 'Open' | 'Fulfilled' | 'Declined';
}

export interface ProfessionalNote {
  noteId: string;
  authorName: string;
  authorBarId: string;
  createdAt: string;
  category: 'Legal Analysis' | 'Liability Assessment' | 'Procedural Strategy' | 'Questions for Client';
  content: string;
  isConfidentialWorkProduct: boolean;
}

export interface LegalDraftVersion {
  versionId: string;
  title: string;
  createdAt: string;
  authorName: string;
  content: string;
  clientApprovalStatus: 'Pending client approval' | 'Approved by client' | 'Changes requested';
  clientApprovalAt?: string;
}

export interface MatterCollaboration {
  invitationStatus: 'Not invited' | 'Pending acceptance' | 'Accepted' | 'Revoked';
  invitedAdvocateName: string;
  invitedAdvocateBarId: string;
  invitedAdvocateJurisdiction: string;
  invitedAt?: string;
  acceptedAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  permissions: LawyerPermissionSet;
  documentRequests: DocumentRequest[];
  professionalNotes: ProfessionalNote[];
  legalDrafts: LegalDraftVersion[];
}

export interface MatterOutcome {
  status: 'Active dispute' | 'Settled' | 'RBI Ombudsman Award' | 'Rejected / Closed' | 'Further legal proceedings';
  summary: string;
  recoveryAmountInr?: number;
  closedAt?: string;
}

export interface BankingMatter {
  matterId: string;
  isIllustrative?: boolean;
  subjectDomain: string;
  title: string;
  category: BankingProblemCategory;
  status: MatterStatus;
  createdAt: string;
  updatedAt: string;
  customer: CustomerDetails;
  bank: BankDetails;
  transaction: TransactionDetails;
  problem: ProblemDetails;
  evidence: EvidenceDocument[];
  extractedFacts: ExtractedFact[];
  timeline: TimelineEvent[];
  chronologyVersions: ChronologyVersion[];
  consistencyAlerts: ConsistencyAlert[];
  missingQuestions: MissingInfoQuestion[];
  legalIssues: MatterLegalIssue[];
  issueEvidenceMatrix: IssueEvidenceMatrixRow[];
  complaints: BankComplaint[];
  ombudsmanCheck?: OmbudsmanEligibilityCheck;
  complaintDrafts: ComplaintDraft[];
  collaboration: MatterCollaboration;
  outcome: MatterOutcome;
  lastAiAnalysisAt?: string;
}

export interface LegalSourceRecord {
  sourceId: string;
  sourceType: 'Act' | 'Rule' | 'Regulation' | 'RBI Direction' | 'RBI Circular' | 'RBI Scheme' | 'Judgment';
  title: string;
  shortName: string;
  issuingAuthority: string;
  publicationDate: string;
  commencementDate: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  amendmentHistory: string;
  supersedes?: string;
  sectionOrParagraph: string;
  applicableCategories: string[];
  summary: string;
  sourceUrl: string;
  verificationStatus: 'Verified' | 'Pending' | 'Outdated' | 'Future Commencement';
  lastVerifiedAt: string;
}

export interface UniversalResearchCard {
  researchCardId: string;
  subjectId: string;
  unitId: string;
  topicId: string;
  legalIssue: string;
  governingLaw: string;
  relevantProvisions: string;
  rulesAndNotifications: string;
  judicialAuthorities: string;
  legalElements: string[];
  relevantFactsNeeded: string[];
  evidenceRequired: string[];
  procedure: string;
  remedies: string;
  currentStatus: 'Verified' | 'Pending' | 'Outdated';
  verificationDate: string;
}

export interface JudicialDecision {
  decisionId: string;
  caseName: string;
  court: string;
  dateOfDecision: string;
  caseNumber: string;
  neutralCitation?: string;
  reportedCitation: string;
  relevantParagraphs: string;
  legalIssue: string;
  ratioDecidendi: string;
  subsequentTreatment: string;
  remainsGoodLaw: boolean;
  officialSourceUrl: string;
  verificationStatus: 'Verified' | 'Requires verification';
}

export interface OpportunityScoreFactor {
  factor: string;
  weight: number;
  score: number;
  rationale: string;
}

export interface StartupEngineProject {
  projectId: string;
  createdAt: string;
  subjectName: string;
  syllabusInput: string;
  extractedTopics: {
    topicId: string;
    unitTitle: string;
    topicTitle: string;
    governingStatutes: string[];
  }[];
  researchCard: UniversalResearchCard;
  problemDiscovery: {
    actors: string[];
    relationships: string[];
    realWorldEvents: string[];
    recurringProblems: string[];
    targetCustomers: string[];
    existingSolutionsGap: string;
  };
  opportunity: {
    productName: string;
    businessModel: string;
    pricingHypothesis: string;
    scoreBreakdown: OpportunityScoreFactor[];
    totalScore: number;
    viabilityVerdict: string;
  };
  productSpec: {
    coreModules: string[];
    dataEntities: string[];
    workflowSteps: string[];
  };
  legalCompliancePlan: {
    bciRule36Compliance: string;
    dpdpCompliance: string;
    regulatoryRisks: string[];
  };
}

export interface AuditLogEntry {
  logId: string;
  timestamp: string;
  actor: string;
  role: 'Customer' | 'Advocate' | 'System';
  matterId?: string;
  action: string;
  detail: string;
  permissionUsed?: string;
}

export interface UserSettings {
  accountName: string;
  email: string;
  activePlan: 'Basic Consumer (Free)' | 'Consumer Plus (₹99–₹199/mo)' | 'Lawyer Workspace (₹499–₹999/mo)' | 'Institutional Licence';
  dpdpConsentAccepted: boolean;
  dpdpConsentTimestamp: string;
  dataRetentionDays: number;
  advocateProfile: {
    fullName: string;
    enrolmentNumber: string;
    barCouncil: string;
    jurisdiction: string;
    practiceAreas: string[];
    verified: boolean;
  };
}

export interface AppDatabase {
  matters: BankingMatter[];
  legalSources: LegalSourceRecord[];
  researchCards: UniversalResearchCard[];
  judgments: JudicialDecision[];
  startupProjects: StartupEngineProject[];
  auditLogs: AuditLogEntry[];
  settings: UserSettings;
}
