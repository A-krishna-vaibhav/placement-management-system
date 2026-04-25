/**
 * Declaration Controller
 * ──────────────────────
 * GET  /api/declarations/current   — fetch latest active declaration version
 * POST /api/declarations/sign      — student signs the current declaration
 * GET  /api/declarations/my        — student's own signature records
 */

const crypto = require('crypto');
const { db } = require('../config/firebase');
const { COLLECTIONS, ROLES } = require('../config/constants');
const { sendDeclarationEmail } = require('../services/emailService');

/* ──────────── GET /api/declarations/current ──────────── */

const getCurrentDeclaration = async (req, res) => {
  try {
    const snap = await db
      .collection(COLLECTIONS.DECLARATION_VERSIONS)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ success: false, message: 'No active declaration found.' });
    }

    const doc = snap.docs[0];
    return res.status(200).json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Get declaration error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch declaration.' });
  }
};

/* ──────────── POST /api/declarations/sign ──────────── */

const signDeclaration = async (req, res) => {
  try {
    const { declarationVersionId, eSignature } = req.body;
    const uid = req.user.uid;

    if (!declarationVersionId || !eSignature) {
      return res.status(400).json({
        success: false,
        message: 'declarationVersionId and eSignature are required.',
      });
    }

    if (req.user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Only students can sign declarations.' });
    }

    // Verify the version exists and is active
    const versionRef = db.collection(COLLECTIONS.DECLARATION_VERSIONS).doc(declarationVersionId);
    const versionDoc = await versionRef.get();
    if (!versionDoc.exists || !versionDoc.data().isActive) {
      return res.status(404).json({ success: false, message: 'Declaration version not found or inactive.' });
    }
    const versionData = versionDoc.data();

    // Check for existing signature on this version
    const existingSnap = await db
      .collection(COLLECTIONS.DECLARATION_SIGNATURES)
      .where('userId', '==', uid)
      .where('declarationVersionId', '==', declarationVersionId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return res.status(409).json({
        success: false,
        message: 'You have already signed this declaration version.',
        data: { id: existingSnap.docs[0].id, ...existingSnap.docs[0].data() },
      });
    }

    // Compute SHA-256 hash of the declaration text at time of signing
    const textHash = crypto
      .createHash('sha256')
      .update(versionData.text || '')
      .digest('hex');

    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;

    const now = new Date().toISOString();
    const signatureDoc = {
      userId:               uid,
      userEmail:            req.user.email,
      userFullName:         req.user.fullName,
      declarationVersionId,
      declarationVersion:   versionData.version,
      eSignature:           eSignature.trim(),
      textHash,
      ipAddress,
      signedAt:             now,
    };

    const ref = await db.collection(COLLECTIONS.DECLARATION_SIGNATURES).add(signatureDoc);

    // Best-effort email — don't fail the response if email fails
    sendDeclarationEmail(req.user.email, req.user.fullName, versionData.version).catch((e) =>
      console.error('Declaration email error:', e)
    );

    return res.status(201).json({
      success: true,
      message: 'Declaration signed successfully.',
      data: { id: ref.id, ...signatureDoc },
    });
  } catch (error) {
    console.error('Sign declaration error:', error);
    return res.status(500).json({ success: false, message: 'Failed to sign declaration.' });
  }
};

/* ──────────── GET /api/declarations/my ──────────── */

const getMySignatures = async (req, res) => {
  try {
    const snap = await db
      .collection(COLLECTIONS.DECLARATION_SIGNATURES)
      .where('userId', '==', req.user.uid)
      .get();

    const signatures = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.signedAt > a.signedAt ? 1 : -1));
    return res.status(200).json({ success: true, data: signatures });
  } catch (error) {
    console.error('Get signatures error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch signatures.' });
  }
};

/* ──────────── POST /api/declarations/seed (admin convenience) ──────────── */

const seedDeclaration = async (req, res) => {
  try {
    const { text, version } = req.body;
    if (!text || !version) {
      return res.status(400).json({ success: false, message: 'text and version are required.' });
    }

    // Deactivate existing active versions
    const existing = await db
      .collection(COLLECTIONS.DECLARATION_VERSIONS)
      .where('isActive', '==', true)
      .get();

    const batch = db.batch();
    existing.docs.forEach((d) => batch.update(d.ref, { isActive: false }));

    const newRef = db.collection(COLLECTIONS.DECLARATION_VERSIONS).doc();
    batch.set(newRef, {
      version,
      text,
      isActive:  true,
      createdAt: new Date().toISOString(),
      createdBy: req.user.uid,
    });

    await batch.commit();

    return res.status(201).json({ success: true, message: 'Declaration version created.', data: { id: newRef.id, version } });
  } catch (error) {
    console.error('Seed declaration error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create declaration version.' });
  }
};

module.exports = { getCurrentDeclaration, signDeclaration, getMySignatures, seedDeclaration };
