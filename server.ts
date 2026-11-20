import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  createInitialDatabase,
  evaluateDateSensitiveRules,
  evaluateOmbudsmanEligibility,
} from './src/data/seedData.ts';
import type {
  AppDatabase,
  AuditLogEntry,
  BankComplaint,
  BankingMatter,
  EvidenceDocument,
  ExtractedFact,
  StartupEngineProject,
  TimelineEvent,
} from './src/types.ts';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'dakshakriti-db.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function loadDb(): AppDatabase {
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw) as AppDatabase;
    } catch {
      const fresh = createInitialDatabase();
      saveDb(fresh);
      return fresh;
    }
  }
  const initial = createInitialDatabase();
  saveDb(initial);
  return initial;
}

function saveDb(db: AppDatabase): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function addAuditLog(
  db: AppDatabase,
  entry: Omit<AuditLogEntry, 'logId' | 'timestamp'>
): void {
  const log: AuditLogEntry = {
    logId: `LOG-${String(db.auditLogs.length + 1).padStart(3, '0')}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sanitizeMatterForRole(matter: BankingMatter, role: string): BankingMatter {
  if (role !== 'advocate') return matter;
  const { collaboration } = matter;
  if (collaboration.invitationStatus !== 'Accepted') {
    return {
      ...matter,
      customer: { ...matter.customer, contactEmail: '[Restricted until invitation accepted]', contactPhone: '[Restricted]' },
      evidence: [],
      extractedFacts: [],
      timeline: [],
    };
  }
  const perms = collaboration.permissions;
  return {
    ...matter,
    evidence: perms.viewSelectedDocuments
      ? matter.evidence.filter((e) => perms.selectedDocumentIds.includes(e.evidenceId))
      : [],
    extractedFacts: perms.viewMatterFacts ? matter.extractedFacts : [],
    timeline: perms.viewChronology ? matter.timeline : [],
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Full state fetch
  app.get('/api/state', (req, res) => {
    const db = loadDb();
    const role = String(req.query.role || 'customer');
    res.json({
      ...db,
      matters: db.matters.map((m) => sanitizeMatterForRole(m, role)),
    });
  });

  // Create new matter
  app.post('/api/matters', (req, res) => {
    const db = loadDb();
    const body = req.body as Partial<BankingMatter>;
    const nextNum = db.matters.length + 1;
    const matterId = `BM-2026-${String(nextNum).padStart(5, '0')}`;
    const now = new Date().toISOString();

    const newMatter: BankingMatter = {
      matterId,
      isIllustrative: false,
      subjectDomain: 'Banking Law (BANKING-LAW-U1-T002)',
      title: body.title?.trim() || `${body.category || 'Banking Dispute'} — ${body.bank?.bankName || 'Bank'}`,
      category: body.category || 'Unauthorised electronic transactions',
      status: body.status || 'Open',
      createdAt: now,
      updatedAt: now,
      customer: body.customer || {
        name: 'Customer',
        contactEmail: '',
        contactPhone: '',
        customerType: 'Individual',
        cityState: '',
      },
      bank: body.bank || {
        bankName: '',
        bankCategory: 'Commercial Bank',
        branch: '',
        accountType: 'Savings Bank Account',
        accountReference: '',
        customerRelationship: 'Account Holder',
      },
      transaction: body.transaction || {
        transactionDate: new Date().toISOString().slice(0, 10),
        amountInr: 0,
        transactionReference: '',
        transactionType: 'Debit',
        paymentMethod: 'UPI / Electronic',
      },
      problem: body.problem || {
        whatHappened: '',
        customerExpected: '',
        whatActuallyHappened: '',
        discoveredDate: new Date().toISOString().slice(0, 10),
        bankContacted: false,
        initialResponseReceived: '',
      },
      evidence: [],
      extractedFacts: [],
      timeline: [],
      chronologyVersions: [
        {
          versionId: 'CHR-V1',
          timestamp: now,
          summary: 'Matter created.',
          eventCount: 0,
          changedBy: body.customer?.name || 'Customer',
        },
      ],
      consistencyAlerts: [],
      missingQuestions: [
        {
          questionId: `MIS-${Date.now()}`,
          question: 'Have you uploaded the primary bank statement and transaction alert?',
          whyRelevant: 'Documentary proof is required before formal bank or RBI Ombudsman submission.',
          status: 'Unanswered',
        },
      ],
      legalIssues: [],
      issueEvidenceMatrix: [],
      complaints: [],
      complaintDrafts: [],
      collaboration: {
        invitationStatus: 'Not invited',
        invitedAdvocateName: '',
        invitedAdvocateBarId: '',
        invitedAdvocateJurisdiction: '',
        permissions: {
          viewMatterFacts: true,
          viewChronology: true,
          viewSelectedDocuments: true,
          selectedDocumentIds: [],
          uploadAdditionalEvidence: false,
          addProfessionalComments: true,
          prepareLegalDrafts: true,
          downloadDocuments: false,
          inviteAnotherProfessional: false,
        },
        documentRequests: [],
        professionalNotes: [],
        legalDrafts: [],
      },
      outcome: {
        status: 'Active dispute',
        summary: 'Matter registered; assembling evidence and chronology.',
      },
    };

    if (newMatter.transaction.transactionDate) {
      newMatter.timeline.push({
        eventId: `EVT-${Date.now()}`,
        matterId,
        date: newMatter.transaction.transactionDate,
        isEstimatedDate: false,
        eventType: 'Transaction',
        title: `Disputed ${newMatter.transaction.transactionType.toLowerCase()} of ₹${Number(
          newMatter.transaction.amountInr || 0
        ).toLocaleString('en-IN')}`,
        description: newMatter.problem.whatHappened || 'Disputed banking transaction recorded at intake.',
        linkedEvidenceIds: [],
        sourceFactIds: [],
        createdBy: 'Customer',
      });
    }

    db.matters.unshift(newMatter);
    addAuditLog(db, {
      actor: newMatter.customer.name,
      role: 'Customer',
      matterId,
      action: 'Matter Registered',
      detail: `Created ${matterId} (${newMatter.category})`,
    });
    saveDb(db);
    res.status(201).json(newMatter);
  });

  // Update matter fields
  app.patch('/api/matters/:matterId', (req, res) => {
    const db = loadDb();
    const idx = db.matters.findIndex((m) => m.matterId === req.params.matterId);
    if (idx === -1) return res.status(404).json({ error: 'Matter not found' });

    const updated: BankingMatter = {
      ...db.matters[idx],
      ...req.body,
      matterId: db.matters[idx].matterId,
      updatedAt: new Date().toISOString(),
    };
    db.matters[idx] = updated;
    addAuditLog(db, {
      actor: req.body._actor || 'User',
      role: req.body._role || 'Customer',
      matterId: updated.matterId,
      action: 'Matter Updated',
      detail: `Updated matter fields / status (${updated.status})`,
    });
    saveDb(db);
    res.json(updated);
  });

  // Upload evidence (preserves original file on disk)
  app.post('/api/matters/:matterId/evidence', (req, res) => {
    const db = loadDb();
    const matter = db.matters.find((m) => m.matterId === req.params.matterId);
    if (!matter) return res.status(404).json({ error: 'Matter not found' });

    const {
      documentName,
      category,
      documentDate,
      source,
      originType,
      mimeType,
      base64Data,
      textContent,
      description,
      legalRelevance,
      notes,
      missingOrUnclearPages,
      actor,
      role,
    } = req.body as Record<string, string>;

    const evidenceId = `EVD-2026-${String(
      db.matters.reduce((sum, m) => sum + m.evidence.length, 0) + 1
    ).padStart(3, '0')}`;

    let storageFileName: string | undefined;
    let fileSize = textContent ? Buffer.byteLength(textContent, 'utf8') : 0;

    if (base64Data) {
      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buf = Buffer.from(cleanBase64, 'base64');
      fileSize = buf.length;
      const safeName = (documentName || 'evidence').replace(/[^a-zA-Z0-9._-]/g, '_');
      storageFileName = `${matter.matterId}_${evidenceId}_${safeName}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, storageFileName), buf);
    }

    const doc: EvidenceDocument = {
      evidenceId,
      matterId: matter.matterId,
      documentName: documentName || `${evidenceId}.txt`,
      category: (category as EvidenceDocument['category']) || 'Other relevant documents',
      uploadDate: new Date().toISOString().slice(0, 10),
      documentDate: documentDate || new Date().toISOString().slice(0, 10),
      source: (source as EvidenceDocument['source']) || 'Customer',
      originType: (originType as EvidenceDocument['originType']) || 'Original',
      mimeType: mimeType || 'text/plain',
      fileSize,
      storageFileName,
      textContent: textContent || '',
      description: description || 'Uploaded supporting document',
      verificationStatus: 'Unreviewed',
      missingOrUnclearPages: missingOrUnclearPages || 'None reported',
      legalRelevance: legalRelevance || 'Pending review',
      notes: notes || '',
      aiProcessed: false,
    };

    matter.evidence.push(doc);
    matter.updatedAt = new Date().toISOString();
    addAuditLog(db, {
      actor: actor || matter.customer.name,
      role: (role as AuditLogEntry['role']) || 'Customer',
      matterId: matter.matterId,
      action: 'Uploaded Original Evidence',
      detail: `Added ${evidenceId}: ${doc.documentName} (${doc.category})`,
    });
    saveDb(db);
    res.status(201).json(doc);
  });

  // Serve or download preserved original file
  app.get('/api/matters/:matterId/evidence/:evidenceId/file', (req, res) => {
    const db = loadDb();
    const matter = db.matters.find((m) => m.matterId === req.params.matterId);
    if (!matter) return res.status(404).send('Matter not found');
    const doc = matter.evidence.find((e) => e.evidenceId === req.params.evidenceId);
    if (!doc) return res.status(404).send('Evidence not found');

    const role = String(req.query.role || 'customer');
    if (role === 'advocate') {
      if (
        matter.collaboration.invitationStatus !== 'Accepted' ||
        !matter.collaboration.permissions.viewSelectedDocuments ||
        !matter.collaboration.permissions.selectedDocumentIds.includes(doc.evidenceId)
      ) {
        return res.status(403).send('Access denied by client permission settings');
      }
      if (req.query.download === '1' && !matter.collaboration.permissions.downloadDocuments) {
        return res.status(403).send('Document download disabled by client permissions');
      }
    }

    addAuditLog(db, {
      actor: role === 'advocate' ? matter.collaboration.invitedAdvocateName : matter.customer.name,
      role: role === 'advocate' ? 'Advocate' : 'Customer',
      matterId: matter.matterId,
      action: req.query.download === '1' ? 'Downloaded Original Evidence' : 'Viewed Original Evidence',
      detail: `${doc.evidenceId} (${doc.documentName})`,
      permissionUsed: role === 'advocate' ? (req.query.download === '1' ? 'downloadDocuments' : 'viewSelectedDocuments') : undefined,
    });
    saveDb(db);

    if (doc.storageFileName) {
      const fullPath = path.join(UPLOADS_DIR, doc.storageFileName);
      if (fs.existsSync(fullPath)) {
        res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
        if (req.query.download === '1') {
          res.setHeader('Content-Disposition', `attachment; filename="${doc.documentName}"`);
        } else {
          res.setHeader('Content-Disposition', `inline; filename="${doc.documentName}"`);
        }
        return fs.createReadStream(fullPath).pipe(res);
      }
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    if (req.query.download === '1') {
      res.setHeader('Content-Disposition', `attachment; filename="${doc.documentName}"`);
    }
    res.send(doc.textContent || 'No file body stored.');
  });

  // Update evidence metadata / review status
  app.patch('/api/matters/:matterId/evidence/:evidenceId', (req, res) => {
    const db = loadDb();
    const matter = db.matters.find((m) => m.matterId === req.params.matterId);
    if (!matter) return res.status(404).json({ error: 'Matter not found' });
    const idx = matter.evidence.findIndex((e) => e.evidenceId === req.params.evidenceId);
    if (idx === -1) return res.status(404).json({ error: 'Evidence not found' });

    matter.evidence[idx] = {
      ...matter.evidence[idx],
      ...req.body,
      evidenceId: matter.evidence[idx].evidenceId,
      matterId: matter.matterId,
    };
    matter.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json(matter.evidence[idx]);
  });

  // AI-assisted OCR & Fact Extraction (marks facts as Pending for human verification)
  app.post('/api/ai/extract-evidence', async (req, res) => {
    try {
      const { matterId, evidenceId } = req.body as { matterId: string; evidenceId: string };
      const db = loadDb();
      const matter = db.matters.find((m) => m.matterId === matterId);
      if (!matter) return res.status(404).json({ error: 'Matter not found' });
      const doc = matter.evidence.find((e) => e.evidenceId === evidenceId);
      if (!doc) return res.status(404).json({ error: 'Evidence document not found' });

      const ai = getGeminiClient();
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      if (doc.storageFileName) {
        const fullPath = path.join(UPLOADS_DIR, doc.storageFileName);
        if (
          fs.existsSync(fullPath) &&
          (doc.mimeType.startsWith('image/') || doc.mimeType === 'application/pdf')
        ) {
          const fileBuf = fs.readFileSync(fullPath);
          parts.push({
            inlineData: {
              mimeType: doc.mimeType,
              data: fileBuf.toString('base64'),
            },
          });
        }
      }

      const promptText = `You are the Document Intelligence & Fact Extraction Engine for Dakshakriti Banking Matter OS.
Analyze this uploaded banking evidence record:
- Document Name: ${doc.documentName}
- User Selected Category: ${doc.category}
- Document Date: ${doc.documentDate}
- Text Content (if any):
${doc.textContent || '(No plain text supplied; inspect attached binary image/PDF if provided)'}

Rules:
1. Extract ONLY factual entries actually visible in the document. Never invent amounts, dates, or reference numbers.
2. Distinguish what the document states from legal conclusions.
3. Return suggested document category, concise summary, and individual extracted facts with page/reference location.`;

      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'You extract objective facts from Indian banking dispute documents. Never fabricate facts or give legal advice.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedCategory: { type: Type.STRING },
              documentSummary: { type: Type.STRING },
              detectedDate: { type: Type.STRING },
              extractedFacts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    factType: { type: Type.STRING },
                    date: { type: Type.STRING },
                    amountInr: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    pageOrReference: { type: Type.STRING },
                  },
                  required: ['factType', 'date', 'description', 'pageOrReference'],
                },
              },
            },
            required: ['detectedCategory', 'documentSummary', 'extractedFacts'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      const newFacts: ExtractedFact[] = (parsed.extractedFacts || []).map(
        (f: { factType: string; date: string; amountInr?: number; description: string; pageOrReference: string }, i: number) => ({
          factId: `FACT-${String(matter.extractedFacts.length + i + 1).padStart(3, '0')}`,
          matterId: matter.matterId,
          factType: f.factType,
          date: f.date || doc.documentDate,
          isEstimatedDate: !f.date,
          amountInr: typeof f.amountInr === 'number' && f.amountInr > 0 ? f.amountInr : undefined,
          description: f.description,
          sourceDocumentId: doc.evidenceId,
          sourceDocumentName: doc.documentName,
          pageOrReference: f.pageOrReference || 'Document Body',
          extractionMethod: 'AI-OCR',
          confidenceLabel: 'Preliminary',
          verificationStatus: 'Pending',
        })
      );

      matter.extractedFacts.push(...newFacts);
      doc.aiProcessed = true;
      if (parsed.documentSummary) {
        doc.description = parsed.documentSummary;
      }
      matter.updatedAt = new Date().toISOString();

      addAuditLog(db, {
        actor: 'Document Intelligence Engine',
        role: 'System',
        matterId: matter.matterId,
        action: 'AI Fact Extraction Completed',
        detail: `Extracted ${newFacts.length} pending fact(s) from ${doc.evidenceId} (awaiting user verification).`,
      });
      saveDb(db);
      res.json({ doc, extractedFacts: newFacts, summary: parsed.documentSummary });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI extraction failed';
      res.status(500).json({ error: msg });
    }
  });

  // Verify / Dispute / Correct extracted fact
  app.patch('/api/matters/:matterId/facts/:factId', (req, res) => {
    const db = loadDb();
    const matter = db.matters.find((m) => m.matterId === req.params.matterId);
    if (!matter) return res.status(404).json({ error: 'Matter not found' });
    const fact = matter.extractedFacts.find((f) => f.factId === req.params.factId);
    if (!fact) return res.status(404).json({ error: 'Fact not found' });

    Object.assign(fact, req.body);
    if (fact.verificationStatus === 'Verified') {
      fact.confidenceLabel = 'Document supported';
    }
    matter.updatedAt = new Date().toISOString();
    addAuditLog(db, {
      actor: matter.customer.name,
      role: 'Customer',
      matterId: matter.matterId,
      action: `Fact ${fact.verificationStatus}`,
      detail: `${fact.factId} marked ${fact.verificationStatus}`,
    });
    saveDb(db);
    res.json(fact);
  });

  // Add timeline event + version tracking
  app.post('/api/matters/:matterId/events', (req, res) => {
    const db = loadDb();
    const matter = db.matters.find((m) => m.matterId === req.params.matterId);
    if (!matter) return res.status(404).json({ error: 'Matter not found' });

    const body = req.body as Partial<TimelineEvent>;
    const event: TimelineEvent = {
      eventId: `EVT-${String(matter.timeline.length + 1).padStart(3, '0')}`,
      matterId: matter.matterId,
      date: body.date || new Date().toISOString().slice(0, 10),
      isEstimatedDate: Boolean(body.isEstimatedDate),
      eventType: body.eventType || 'Transaction',
      title: body.title || 'Recorded event',
      description: body.description || '',
      linkedEvidenceIds: body.linkedEvidenceIds || [],
      sourceFactIds: body.sourceFactIds || [],
      createdBy: body.createdBy || 'Customer',
    };

    matter.timeline.push(event);
    matter.timeline.sort((a, b) => a.date.localeCompare(b.date));
    matter.chronologyVersions.push({
      versionId: `CHR-V${matter.chronologyVersions.length + 1}`,
      timestamp: new Date().toISOString(),
      summary: `Added event "${event.title}" (${event.date}).`,
      eventCount: matter.timeline.length,
      changedBy: event.createdBy,
    });
    matter.updatedAt = new Date().toISOString();
    saveDb(db);
    res.status(201).json(event);
  });

  // V1.5 Source-First, Date-Sensitive AI Legal Issue Analysis Engine
  app.post('/api/ai/analyze-matter', async (req, res) => {
    try {
      const { matterId } = req.body as { matterId: string };
      const db = loadDb();
      const matter = db.matters.find((m) => m.matterId === matterId);
      if (!matter) return res.status(404).json({ error: 'Matter not found' });

      const ai = getGeminiClient();
      const dateRules = evaluateDateSensitiveRules(
        matter.transaction.transactionDate,
        matter.bank.bankCategory
      );

      const allowedSources = db.legalSources.map((s) => ({
        sourceId: s.sourceId,
        title: s.title,
        effectiveFrom: s.effectiveFrom,
        effectiveUntil: s.effectiveUntil || 'Ongoing',
        verificationStatus: s.verificationStatus,
        sectionOrParagraph: s.sectionOrParagraph,
      }));

      const prompt = `You are the V1.5 AI Legal Issue Classification & Analysis Engine of Dakshakriti Banking Matter OS.

CRITICAL ARCHITECTURE & LEGAL RULES:
1. SOURCE-FIRST LEGAL RESEARCH: Only cite sourceIds from this verified database register:
${JSON.stringify(allowedSources, null, 2)}
Never invent a section, judgment, quotation, or deadline.
2. DATE-SENSITIVE APPLICABILITY:
   - Matter Transaction Date: ${matter.transaction.transactionDate}
   - Bank Category: ${matter.bank.bankCategory}
   - Automated Rule Check Result: ${dateRules.applicableLiabilityRule.sourceId} (${dateRules.applicableLiabilityRule.title}) -> ${dateRules.applicableLiabilityRule.reason}
   - RBI Ombudsman 2026 Check: ${dateRules.ombudsmanScheme.note}
3. NO AUTOMATIC LIABILITY OR WIN PROBABILITY:
   - Never declare the bank has violated the law or automatically owes a refund.
   - Never return a percentage probability of winning.
   - Present every classification as "Preliminary" requiring independent lawyer review.

MATTER RECORD:
- Matter ID: ${matter.matterId}
- Category: ${matter.category}
- Problem: ${matter.problem.whatHappened}
- Customer Expected: ${matter.problem.customerExpected}
- Actually Happened: ${matter.problem.whatActuallyHappened}
- Evidence Count: ${matter.evidence.length} (${matter.evidence.map((e) => `${e.evidenceId}: ${e.category} - ${e.documentName}`).join('; ')})
- Extracted Facts: ${matter.extractedFacts.map((f) => `${f.factId} [${f.verificationStatus}] (${f.date}): ${f.description}`).join(' | ')}
- Timeline: ${matter.timeline.map((t) => `${t.date}: ${t.title}`).join(' -> ')}
- Complaints: ${matter.complaints.map((c) => `${c.complaintId} on ${c.complaintDate} ref ${c.bankReferenceNumber} status ${c.status}: ${c.bankResponse}`).join(' | ')}

Analyze the matter and return structured JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a strict Indian banking law matter-structuring assistant. Distinguish facts, preliminary legal questions, and independent professional review.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              legalIssues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    classification: { type: Type.STRING },
                    isPrimary: { type: Type.BOOLEAN },
                    preliminarySummary: { type: Type.STRING },
                    linkedSourceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['title', 'classification', 'isPrimary', 'preliminarySummary', 'linkedSourceIds'],
                },
              },
              issueEvidenceMatrix: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    legalQuestion: { type: Type.STRING },
                    relevantEvidenceRequired: { type: Type.STRING },
                    status: { type: Type.STRING },
                  },
                  required: ['legalQuestion', 'relevantEvidenceRequired', 'status'],
                },
              },
              consistencyAlerts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    issueType: { type: Type.STRING },
                    message: { type: Type.STRING },
                  },
                  required: ['issueType', 'message'],
                },
              },
              missingQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    whyRelevant: { type: Type.STRING },
                  },
                  required: ['question', 'whyRelevant'],
                },
              },
            },
            required: ['legalIssues', 'issueEvidenceMatrix', 'consistencyAlerts', 'missingQuestions'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      const validSourceIds = new Set(db.legalSources.map((s) => s.sourceId));

      matter.legalIssues = (parsed.legalIssues || []).map(
        (
          iss: {
            title: string;
            classification: string;
            isPrimary: boolean;
            preliminarySummary: string;
            linkedSourceIds: string[];
          },
          idx: number
        ) => ({
          issueId: `ISS-${String(idx + 1).padStart(3, '0')}`,
          title: iss.title,
          classification: (iss.classification as BankingMatter['legalIssues'][0]['classification']) || 'RBI regulatory issue',
          isPrimary: Boolean(iss.isPrimary),
          preliminarySummary: iss.preliminarySummary,
          statusLabel: 'Preliminary',
          linkedSourceIds: (iss.linkedSourceIds || []).filter((id) => validSourceIds.has(id)),
          linkedFactIds: matter.extractedFacts.slice(0, 2).map((f) => f.factId),
          linkedEvidenceIds: matter.evidence.slice(0, 2).map((e) => e.evidenceId),
        })
      );

      matter.issueEvidenceMatrix = (parsed.issueEvidenceMatrix || []).map(
        (row: { legalQuestion: string; relevantEvidenceRequired: string; status: string }) => ({
          legalQuestion: row.legalQuestion,
          relevantEvidenceRequired: row.relevantEvidenceRequired,
          status: row.status === 'Available' || row.status === 'Partial' ? row.status : 'Missing',
          linkedEvidenceIds: matter.evidence.map((e) => e.evidenceId),
        })
      );

      if (Array.isArray(parsed.consistencyAlerts) && parsed.consistencyAlerts.length > 0) {
        matter.consistencyAlerts = parsed.consistencyAlerts.map(
          (a: { issueType: string; message: string }, idx: number) => ({
            alertId: `ALT-${String(idx + 1).padStart(3, '0')}`,
            issueType: (a.issueType as BankingMatter['consistencyAlerts'][0]['issueType']) || 'Incomplete record',
            message: a.message,
            relatedIds: [],
            resolved: false,
          })
        );
      }

      if (Array.isArray(parsed.missingQuestions) && parsed.missingQuestions.length > 0) {
        matter.missingQuestions = parsed.missingQuestions.map(
          (q: { question: string; whyRelevant: string }, idx: number) => ({
            questionId: `MIS-${String(idx + 1).padStart(3, '0')}`,
            question: q.question,
            whyRelevant: q.whyRelevant,
            status: 'Unanswered',
          })
        );
      }

      matter.lastAiAnalysisAt = new Date().toISOString();
      matter.updatedAt = new Date().toISOString();

      addAuditLog(db, {
        actor: 'AI Issue Classification Engine',
        role: 'System',
        matterId: matter.matterId,
        action: 'Preliminary Legal Issue Analysis Executed',
        detail: `Classified ${matter.legalIssues.length} preliminary issue(s) grounded to ${dateRules.applicableLiabilityRule.sourceId}.`,
      });
      saveDb(db);
      res.json(matter);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI matter analysis failed';
      res.status(500).json({ error: msg });
    }
  });

  // Override / correct AI issue classification
  app.patch('/api/matters/:matterId/issues/:issueId', (req, res) => {
    const db = loadDb();
    const matter = db.matters.find((m) => m.matterId === req.params.matterId);
    if (!matter) return res.status(404).json({ error: 'Matter not found' });
    const issue = matter.legalIssues.find((i) => i.issueId === req.params.issueId);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    Object.assign(issue, req.body, { statusLabel: 'User-adjusted' });
    matter.updatedAt = new Date().toISOString();
    addAuditLog(db, {
      actor: matter.customer.name,
      role: 'Customer',
      matterId: matter.matterId,
      action: 'Legal Classification Adjusted',
      detail: `Adjusted ${issue.issueId} to "${issue.classification}" (Reason: ${issue.userOverrideReason || 'User edit'})`,
    });
    saveDb(db);
    res.json(issue);
  });

  // Create or update complaint & run RBI Ombudsman 2026 eligibility engine
  app.post('/api/matters/:matterId/complaints', (req, res) => {
    const db = loadDb();
    const matter = db.matters.find((m) => m.matterId === req.params.matterId);
    if (!matter) return res.status(404).json({ error: 'Matter not found' });

    const body = req.body as Partial<BankComplaint>;
    const complaint: BankComplaint = {
      complaintId: `CMP-2026-${String(
        db.matters.reduce((sum, m) => sum + m.complaints.length, 0) + 1
      ).padStart(3, '0')}`,
      matterId: matter.matterId,
      bankName: body.bankName || matter.bank.bankName,
      bankCategory: body.bankCategory || matter.bank.bankCategory,
      channel: body.channel || 'Bank Portal',
      complaintDate: body.complaintDate || new Date().toISOString().slice(0, 10),
      bankReferenceNumber: body.bankReferenceNumber || '',
      category: body.category || matter.category,
      status: body.status || 'Submitted',
      bankResponse: body.bankResponse || '',
      bankResponseDate: body.bankResponseDate,
      nextAction: body.nextAction || 'Monitor 30-day statutory bank response period.',
      supportingEvidenceIds: body.supportingEvidenceIds || matter.evidence.map((e) => e.evidenceId),
      escalationHistory: [
        {
          date: body.complaintDate || new Date().toISOString().slice(0, 10),
          stage: `${body.channel || 'Bank Portal'} Submission`,
          note: body.bankReferenceNumber
            ? `Registered with Ref ${body.bankReferenceNumber}`
            : 'Complaint logged.',
        },
      ],
    };

    matter.complaints.unshift(complaint);
    matter.ombudsmanCheck = evaluateOmbudsmanEligibility({
      bankCategory: complaint.bankCategory,
      complaintDate: complaint.complaintDate,
      bankResponse: complaint.bankResponse,
      bankResponseDate: complaint.bankResponseDate,
      hasWrittenProof: Boolean(complaint.complaintDate),
      pendingInCourt: false,
      commercialJudgmentOnly: false,
    });
    if (matter.status === 'Open' || matter.status === 'Under review') {
      matter.status = 'Complaint filed';
    }
    matter.updatedAt = new Date().toISOString();
    addAuditLog(db, {
      actor: matter.customer.name,
      role: 'Customer',
      matterId: matter.matterId,
      action: 'Complaint Logged',
      detail: `Created internal ${complaint.complaintId} (Bank Ref: ${complaint.bankReferenceNumber || 'Pending'})`,
    });
    saveDb(db);
    res.status(201).json({ complaint, ombudsmanCheck: matter.ombudsmanCheck });
  });

  app.post('/api/matters/:matterId/ombudsman-check', (req, res) => {
    const db = loadDb();
    const matter = db.matters.find((m) => m.matterId === req.params.matterId);
    if (!matter) return res.status(404).json({ error: 'Matter not found' });

    const latestComplaint = matter.complaints[0];
    const check = evaluateOmbudsmanEligibility({
      bankCategory: req.body.bankCategory || matter.bank.bankCategory,
      complaintDate: req.body.complaintDate ?? latestComplaint?.complaintDate,
      bankResponse: req.body.bankResponse ?? latestComplaint?.bankResponse,
      bankResponseDate: req.body.bankResponseDate ?? latestComplaint?.bankResponseDate,
      hasWrittenProof: Boolean(req.body.hasWrittenProof),
      pendingInCourt: Boolean(req.body.pendingInCourt),
      commercialJudgmentOnly: Boolean(req.body.commercialJudgmentOnly),
    });

    matter.ombudsmanCheck = check;
    matter.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json(check);
  });

  // Draft complaint (Bank GRO or RBI Ombudsman) using Gemini AI
  app.post('/api/ai/draft-complaint', async (req, res) => {
    try {
      const { matterId, target } = req.body as {
        matterId: string;
        target: 'Bank Grievance Redressal Officer' | 'RBI Integrated Ombudsman (CMS)';
      };
      const db = loadDb();
      const matter = db.matters.find((m) => m.matterId === matterId);
      if (!matter) return res.status(404).json({ error: 'Matter not found' });

      const ai = getGeminiClient();
      const dateRules = evaluateDateSensitiveRules(
        matter.transaction.transactionDate,
        matter.bank.bankCategory
      );

      const prompt = `Prepare a structured, factual complaint draft template for: ${target}.
Matter ID: ${matter.matterId}
Customer: ${matter.customer.name} (${matter.customer.customerType}, ${matter.customer.cityState})
Bank: ${matter.bank.bankName} (${matter.bank.bankCategory}), Branch: ${matter.bank.branch}, A/c Ref: ${matter.bank.accountReference}
Transaction: ${matter.transaction.transactionDate}, INR ${matter.transaction.amountInr}, Ref: ${matter.transaction.transactionReference}, Method: ${matter.transaction.paymentMethod}
Problem: ${matter.problem.whatHappened}
Expected vs Actual: ${matter.problem.customerExpected} vs ${matter.problem.whatActuallyHappened}
Prior Complaints: ${matter.complaints.map((c) => `${c.complaintDate} Ref ${c.bankReferenceNumber} Reply: ${c.bankResponse || 'No reply'}`).join('; ')}
Supporting Evidence Index: ${matter.evidence.map((e) => `${e.evidenceId}: ${e.documentName} (${e.category}, ${e.documentDate})`).join('; ')}
Applicable Rule Reference: ${dateRules.applicableLiabilityRule.title} & ${dateRules.ombudsmanScheme.title}

Follow the exact 8-section structure for Banking Complaint (Complainant details, Facts of the matter, Details of disputed transaction, Previous communication, Nature of grievance, Supporting documents index, Relief requested, Declaration). For RBI Ombudsman, explicitly include Bank complaint date, Bank complaint ref, Proof of prior complaint, Bank response / non-response explanation, and Grounds for deficiency in service. Never guarantee an award or refund. Mark clearly at top: DRAFT TEMPLATE ONLY — MUST BE CHECKED AND APPROVED BEFORE SUBMISSION.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You draft structured, factual Indian banking complaint templates without promising legal outcomes or fabricating citations.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ['subject', 'body'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      const draft = {
        draftId: `DRF-2026-${String(matter.complaintDrafts.length + 1).padStart(3, '0')}`,
        target,
        createdAt: new Date().toISOString().slice(0, 10),
        subject: parsed.subject || `Complaint regarding ${matter.category}`,
        body: parsed.body || '',
        status: 'Draft template only — unverified' as const,
      };
      matter.complaintDrafts.unshift(draft);
      matter.updatedAt = new Date().toISOString();
      addAuditLog(db, {
        actor: 'Complaint Drafting Engine',
        role: 'System',
        matterId: matter.matterId,
        action: 'Complaint Draft Generated',
        detail: `Generated ${draft.draftId} for ${target}`,
      });
      saveDb(db);
      res.status(201).json(draft);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate complaint draft';
      res.status(500).json({ error: msg });
    }
  });

  // Collaboration & Permissions (V1.6–V1.7)
  app.post('/api/matters/:matterId/collaboration', (req, res) => {
    const db = loadDb();
    const matter = db.matters.find((m) => m.matterId === req.params.matterId);
    if (!matter) return res.status(404).json({ error: 'Matter not found' });

    const { action, payload } = req.body as { action: string; payload: Record<string, unknown> };

    if (action === 'invite') {
      matter.collaboration.invitationStatus = 'Accepted'; // Direct consent-based workspace activation for independently selected advocate
      matter.collaboration.invitedAdvocateName = String(payload.name || 'Adv. Priya Nair');
      matter.collaboration.invitedAdvocateBarId = String(payload.barId || 'BAR/IND/2020');
      matter.collaboration.invitedAdvocateJurisdiction = String(payload.jurisdiction || 'High Court & Consumer Commissions');
      matter.collaboration.invitedAt = new Date().toISOString();
      matter.collaboration.acceptedAt = new Date().toISOString();
      matter.collaboration.revokedAt = undefined;
      addAuditLog(db, {
        actor: matter.customer.name,
        role: 'Customer',
        matterId: matter.matterId,
        action: 'Invited Independently Selected Advocate',
        detail: `Granted workspace access to ${matter.collaboration.invitedAdvocateName} (${matter.collaboration.invitedAdvocateBarId})`,
      });
    } else if (action === 'updatePermissions') {
      matter.collaboration.permissions = {
        ...matter.collaboration.permissions,
        ...(payload as Partial<BankingMatter['collaboration']['permissions']>),
      };
      addAuditLog(db, {
        actor: matter.customer.name,
        role: 'Customer',
        matterId: matter.matterId,
        action: 'Updated Advocate Permissions',
        detail: `Modified granular matter/document access controls (${matter.collaboration.permissions.selectedDocumentIds.length} doc(s) shared).`,
      });
    } else if (action === 'revoke') {
      matter.collaboration.invitationStatus = 'Revoked';
      matter.collaboration.revokedAt = new Date().toISOString();
      matter.collaboration.revocationReason = String(payload.reason || 'Access closed by client');
      addAuditLog(db, {
        actor: matter.customer.name,
        role: 'Customer',
        matterId: matter.matterId,
        action: 'Revoked Advocate Access',
        detail: `Access revoked for ${matter.collaboration.invitedAdvocateName}: ${matter.collaboration.revocationReason}`,
      });
    } else if (action === 'addNote') {
      if (!matter.collaboration.permissions.addProfessionalComments || matter.collaboration.invitationStatus !== 'Accepted') {
        return res.status(403).json({ error: 'Professional commenting is not permitted or access is revoked.' });
      }
      matter.collaboration.professionalNotes.unshift({
        noteId: `NOTE-${String(matter.collaboration.professionalNotes.length + 1).padStart(3, '0')}`,
        authorName: matter.collaboration.invitedAdvocateName || 'Advocate',
        authorBarId: matter.collaboration.invitedAdvocateBarId,
        createdAt: new Date().toISOString().slice(0, 10),
        category: (payload.category as BankingMatter['collaboration']['professionalNotes'][0]['category']) || 'Legal Analysis',
        content: String(payload.content || ''),
        isConfidentialWorkProduct: true,
      });
      addAuditLog(db, {
        actor: matter.collaboration.invitedAdvocateName,
        role: 'Advocate',
        matterId: matter.matterId,
        action: 'Added Confidential Work Product Note',
        detail: `Recorded ${String(payload.category || 'Legal Analysis')} note separately from original evidence.`,
        permissionUsed: 'addProfessionalComments',
      });
    } else if (action === 'requestDocument') {
      matter.collaboration.documentRequests.unshift({
        requestId: `REQ-${String(matter.collaboration.documentRequests.length + 1).padStart(3, '0')}`,
        requestedBy: matter.collaboration.invitedAdvocateName || 'Advocate',
        requestedAt: new Date().toISOString().slice(0, 10),
        title: String(payload.title || ''),
        reason: String(payload.reason || ''),
        status: 'Open',
      });
      addAuditLog(db, {
        actor: matter.collaboration.invitedAdvocateName,
        role: 'Advocate',
        matterId: matter.matterId,
        action: 'Requested Additional Document',
        detail: String(payload.title || ''),
      });
    } else if (action === 'addDraft') {
      if (!matter.collaboration.permissions.prepareLegalDrafts || matter.collaboration.invitationStatus !== 'Accepted') {
        return res.status(403).json({ error: 'Draft preparation not permitted by client.' });
      }
      matter.collaboration.legalDrafts.unshift({
        versionId: `LD-V${matter.collaboration.legalDrafts.length + 1}`,
        title: String(payload.title || 'Legal Draft'),
        createdAt: new Date().toISOString().slice(0, 10),
        authorName: matter.collaboration.invitedAdvocateName || 'Advocate',
        content: String(payload.content || ''),
        clientApprovalStatus: 'Pending client approval',
      });
      addAuditLog(db, {
        actor: matter.collaboration.invitedAdvocateName,
        role: 'Advocate',
        matterId: matter.matterId,
        action: 'Prepared Legal Draft Version',
        detail: String(payload.title || 'Legal Draft'),
        permissionUsed: 'prepareLegalDrafts',
      });
    } else if (action === 'approveDraft') {
      const draft = matter.collaboration.legalDrafts.find((d) => d.versionId === payload.versionId);
      if (draft) {
        draft.clientApprovalStatus = (payload.status as 'Approved by client' | 'Changes requested') || 'Approved by client';
        draft.clientApprovalAt = new Date().toISOString().slice(0, 10);
        addAuditLog(db, {
          actor: matter.customer.name,
          role: 'Customer',
          matterId: matter.matterId,
          action: `Client Draft Decision: ${draft.clientApprovalStatus}`,
          detail: `${draft.versionId} — ${draft.title}`,
        });
      }
    }

    matter.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json(matter.collaboration);
  });

  // V2.0 Universal LLB Startup Engine (Gemini-powered Syllabus-to-Startup Generator)
  app.post('/api/ai/startup-engine', async (req, res) => {
    try {
      const { subjectName, syllabusInput } = req.body as {
        subjectName: string;
        syllabusInput: string;
      };
      if (!syllabusInput?.trim()) {
        return res.status(400).json({ error: 'Please enter or paste LLB syllabus text.' });
      }

      const ai = getGeminiClient();
      const prompt = `You are the Universal LLB Startup Engine (V2.0) of Dakshakriti (founded by Deepak Sharma).
Transform the following LLB Syllabus input into a verified legal research card, real-world problem discovery map, scored business opportunity (100-point rubric), product architecture specification, and Indian legal compliance plan.

SUBJECT: ${subjectName || 'LLB Legal Subject'}
SYLLABUS INPUT:
${syllabusInput}

SCORING WEIGHTS (must use exact weights totaling 100):
- Severity of customer problem (weight 15)
- Frequency of the problem (weight 10)
- Willingness to pay (weight 15)
- Market size (weight 10)
- Existing solution gap (weight 10)
- Legal feasibility (weight 15)
- Technical feasibility (weight 10)
- Revenue potential (weight 10)
- Pilot accessibility (weight 5)

Compliance Rules:
- Any professional workflow must comply with Bar Council of India Rule 36 (no advocate advertising, solicitation, or lead-brokerage commissions).
- Account for DPDP Act 2023 & Rules 2025.
- Note clearly whether statutes/codes are active in force or pending commencement notification.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an Indian legal-tech product architect converting LLB syllabus topics into realistic, compliant legal-matter software products.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedTopics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topicId: { type: Type.STRING },
                    unitTitle: { type: Type.STRING },
                    topicTitle: { type: Type.STRING },
                    governingStatutes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['topicId', 'unitTitle', 'topicTitle', 'governingStatutes'],
                },
              },
              researchCard: {
                type: Type.OBJECT,
                properties: {
                  subjectId: { type: Type.STRING },
                  unitId: { type: Type.STRING },
                  topicId: { type: Type.STRING },
                  legalIssue: { type: Type.STRING },
                  governingLaw: { type: Type.STRING },
                  relevantProvisions: { type: Type.STRING },
                  rulesAndNotifications: { type: Type.STRING },
                  judicialAuthorities: { type: Type.STRING },
                  legalElements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  relevantFactsNeeded: { type: Type.ARRAY, items: { type: Type.STRING } },
                  evidenceRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
                  procedure: { type: Type.STRING },
                  remedies: { type: Type.STRING },
                },
                required: [
                  'subjectId',
                  'unitId',
                  'topicId',
                  'legalIssue',
                  'governingLaw',
                  'relevantProvisions',
                  'rulesAndNotifications',
                  'legalElements',
                  'evidenceRequired',
                  'procedure',
                  'remedies',
                ],
              },
              problemDiscovery: {
                type: Type.OBJECT,
                properties: {
                  actors: { type: Type.ARRAY, items: { type: Type.STRING } },
                  relationships: { type: Type.ARRAY, items: { type: Type.STRING } },
                  realWorldEvents: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recurringProblems: { type: Type.ARRAY, items: { type: Type.STRING } },
                  targetCustomers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  existingSolutionsGap: { type: Type.STRING },
                },
                required: ['actors', 'relationships', 'realWorldEvents', 'recurringProblems', 'targetCustomers', 'existingSolutionsGap'],
              },
              opportunity: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING },
                  businessModel: { type: Type.STRING },
                  pricingHypothesis: { type: Type.STRING },
                  scoreBreakdown: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        factor: { type: Type.STRING },
                        weight: { type: Type.NUMBER },
                        score: { type: Type.NUMBER },
                        rationale: { type: Type.STRING },
                      },
                      required: ['factor', 'weight', 'score', 'rationale'],
                    },
                  },
                  viabilityVerdict: { type: Type.STRING },
                },
                required: ['productName', 'businessModel', 'pricingHypothesis', 'scoreBreakdown', 'viabilityVerdict'],
              },
              productSpec: {
                type: Type.OBJECT,
                properties: {
                  coreModules: { type: Type.ARRAY, items: { type: Type.STRING } },
                  dataEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  workflowSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['coreModules', 'dataEntities', 'workflowSteps'],
              },
              legalCompliancePlan: {
                type: Type.OBJECT,
                properties: {
                  bciRule36Compliance: { type: Type.STRING },
                  dpdpCompliance: { type: Type.STRING },
                  regulatoryRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['bciRule36Compliance', 'dpdpCompliance', 'regulatoryRisks'],
              },
            },
            required: [
              'extractedTopics',
              'researchCard',
              'problemDiscovery',
              'opportunity',
              'productSpec',
              'legalCompliancePlan',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      const db = loadDb();
      const totalScore = (parsed.opportunity?.scoreBreakdown || []).reduce(
        (sum: number, item: { score: number; weight: number }) => sum + Math.min(item.score || 0, item.weight || 15),
        0
      );

      const project: StartupEngineProject = {
        projectId: `STR-2026-${String(db.startupProjects.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString(),
        subjectName: subjectName || 'Custom LLB Subject',
        syllabusInput,
        extractedTopics: parsed.extractedTopics || [],
        researchCard: {
          researchCardId: `RC-${parsed.researchCard?.topicId || 'CUSTOM-001'}`,
          subjectId: parsed.researchCard?.subjectId || 'CUSTOM-LAW',
          unitId: parsed.researchCard?.unitId || 'UNIT-I',
          topicId: parsed.researchCard?.topicId || 'TOPIC-001',
          legalIssue: parsed.researchCard?.legalIssue || '',
          governingLaw: parsed.researchCard?.governingLaw || '',
          relevantProvisions: parsed.researchCard?.relevantProvisions || '',
          rulesAndNotifications: parsed.researchCard?.rulesAndNotifications || '',
          judicialAuthorities: parsed.researchCard?.judicialAuthorities || 'Pending primary verification',
          legalElements: parsed.researchCard?.legalElements || [],
          relevantFactsNeeded: parsed.researchCard?.relevantFactsNeeded || [],
          evidenceRequired: parsed.researchCard?.evidenceRequired || [],
          procedure: parsed.researchCard?.procedure || '',
          remedies: parsed.researchCard?.remedies || '',
          currentStatus: 'Pending',
          verificationDate: new Date().toISOString().slice(0, 10),
        },
        problemDiscovery: parsed.problemDiscovery,
        opportunity: {
          ...parsed.opportunity,
          totalScore,
        },
        productSpec: parsed.productSpec,
        legalCompliancePlan: parsed.legalCompliancePlan,
      };

      db.startupProjects.unshift(project);
      addAuditLog(db, {
        actor: db.settings.accountName,
        role: 'Customer',
        action: 'Generated LLB Startup Blueprint',
        detail: `${project.projectId}: ${project.opportunity.productName} (Score ${totalScore}/100)`,
      });
      saveDb(db);
      res.status(201).json(project);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Startup Engine generation failed';
      res.status(500).json({ error: msg });
    }
  });

  // Settings & DPDP retention controls
  app.patch('/api/settings', (req, res) => {
    const db = loadDb();
    db.settings = {
      ...db.settings,
      ...req.body,
      advocateProfile: {
        ...db.settings.advocateProfile,
        ...(req.body.advocateProfile || {}),
      },
    };
    addAuditLog(db, {
      actor: db.settings.accountName,
      role: 'Customer',
      action: 'Updated Privacy & Workspace Settings',
      detail: `Plan: ${db.settings.activePlan} | Retention: ${db.settings.dataRetentionDays} days`,
    });
    saveDb(db);
    res.json(db.settings);
  });

  // Reset illustrative dataset (explicit user data-retention action)
  app.post('/api/reset-demo', (_req, res) => {
    const fresh = createInitialDatabase();
    saveDb(fresh);
    res.json(fresh);
  });

  // Vite middleware in dev; dist static serving in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dakshakriti full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
