/**
 * Resume Controller
 * ─────────────────
 * POST   /api/profile/resume             — upload PDF resume (max 5 MB, 3-version rolling cap)
 * DELETE /api/profile/resume/:versionId  — delete a specific resume version
 */

const { v4: uuidv4 } = require('uuid');
const { db, storage } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');

const MAX_RESUME_VERSIONS = 3;

/* ──────────── POST /api/profile/resume ──────────── */

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required.' });
    }

    const uid = req.user.uid;
    const profileRef = db.collection(COLLECTIONS.STUDENT_PROFILES).doc(uid);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const profile = profileDoc.data();
    const existingResumes = profile.resumes || [];

    // Enforce 3-version cap — delete oldest from Storage if at limit
    let updatedResumes = [...existingResumes];
    if (updatedResumes.length >= MAX_RESUME_VERSIONS) {
      const oldest = updatedResumes[0];
      if (oldest?.storagePath && storage) {
        try {
          await storage.bucket().file(oldest.storagePath).delete();
        } catch (e) {
          console.error('Failed to delete old resume from Storage:', e.message);
        }
      }
      updatedResumes = updatedResumes.slice(1);
    }

    const versionId = uuidv4();
    const storagePath = `resumes/${uid}/${versionId}.pdf`;
    const now = new Date().toISOString();

    let url = null;
    if (storage) {
      const bucket = storage.bucket();
      const file = bucket.file(storagePath);
      await file.save(req.file.buffer, {
        metadata: { contentType: 'application/pdf' },
      });
      await file.makePublic();
      url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    }

    const resumeEntry = {
      versionId,
      storagePath,
      url,
      originalName: req.file.originalname,
      sizeBytes:    req.file.size,
      uploadedAt:   now,
    };

    updatedResumes.push(resumeEntry);

    await profileRef.update({
      resumes:   updatedResumes,
      updatedAt: now,
    });

    return res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully.',
      data:    resumeEntry,
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload resume.' });
  }
};

/* ──────────── DELETE /api/profile/resume/:versionId ──────────── */

const deleteResume = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { versionId } = req.params;

    const profileRef = db.collection(COLLECTIONS.STUDENT_PROFILES).doc(uid);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const profile = profileDoc.data();
    const resumes = profile.resumes || [];
    const target = resumes.find((r) => r.versionId === versionId);

    if (!target) {
      return res.status(404).json({ success: false, message: 'Resume version not found.' });
    }

    if (target.storagePath && storage) {
      try {
        await storage.bucket().file(target.storagePath).delete();
      } catch (e) {
        console.error('Failed to delete from Storage:', e.message);
      }
    }

    const updated = resumes.filter((r) => r.versionId !== versionId);
    await profileRef.update({ resumes: updated, updatedAt: new Date().toISOString() });

    return res.status(200).json({ success: true, message: 'Resume deleted.' });
  } catch (error) {
    console.error('Delete resume error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete resume.' });
  }
};

module.exports = { uploadResume, deleteResume };
