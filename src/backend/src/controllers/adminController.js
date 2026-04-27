/**
 * Admin Controller
 * ────────────────
 * GET    /api/admin/users                       — list users (filterable)
 * PATCH  /api/admin/users/:id/role              — update user role
 * PATCH  /api/admin/users/:id/status            — update user status
 * DELETE /api/admin/users/:id                   — delete user
 * POST   /api/admin/users/faculty               — provision Faculty account
 * POST   /api/admin/users/tpo                   — provision TPO account
 * PATCH  /api/admin/companies/:companyId/approve — approve company
 * PATCH  /api/admin/companies/:companyId/reject  — reject company
 */

const { auth, db } = require('../config/firebase');
const {
  COLLECTIONS,
  ROLES,
  ACCOUNT_STATUS,
  COMPANY_STATUS,
  AUDIT_ACTION,
} = require('../config/constants');
const { handleValidationErrors } = require('../utils/validationHelper');
const auditLogger = require('../services/auditLogger');
const crypto = require('crypto');
const {
  sendCompanyApprovedEmail,
  sendCompanyRejectedEmail,
} = require('../services/emailService');

/* ──────────────────── GET /api/admin/users ──────────────────── */

const listUsers = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { role, status, page = 1, limit = 20 } = req.query;

    let query = db.collection(COLLECTIONS.USERS);

    if (role)   query = query.where('role',   '==', role);
    if (status) query = query.where('status', '==', status);

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const users = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid:       doc.id,
        fullName:  data.fullName,
        email:     data.email,
        role:      data.role,
        status:    data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    const startIndex    = (parseInt(page) - 1) * parseInt(limit);
    const paginatedUsers = users.slice(startIndex, startIndex + parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        users:      paginatedUsers,
        total:      users.length,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(users.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

/* ──────────────────── PATCH /api/admin/users/:id/role ──────────────────── */

const updateUserRole = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { id } = req.params;
    const { role } = req.body;

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await db.collection(COLLECTIONS.USERS).doc(id).update({
      role,
      updatedAt: new Date().toISOString(),
    });
    await auth.setCustomUserClaims(id, { role });

    await auditLogger.log({
      actorUserId: req.user.uid, actorRole: req.user.role,
      actionType: AUDIT_ACTION.ROLE_CHANGE, targetType: 'user', targetId: id,
      payloadSummary: `Role changed to ${role}`, ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `User role updated to '${role}'.`,
      data: { uid: id, role },
    });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
};

/* ──────────────────── PATCH /api/admin/users/:id/status ──────────────────── */

const updateUserStatus = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { id } = req.params;
    const { status } = req.body;

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await db.collection(COLLECTIONS.USERS).doc(id).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    if (status === ACCOUNT_STATUS.DEACTIVATED || status === ACCOUNT_STATUS.SUSPENDED) {
      await auth.updateUser(id, { disabled: true });
    } else if (status === ACCOUNT_STATUS.ACTIVE) {
      await auth.updateUser(id, { disabled: false });
    }

    if (status === ACCOUNT_STATUS.DEACTIVATED) {
      await auditLogger.log({
        actorUserId: req.user.uid, actorRole: req.user.role,
        actionType: AUDIT_ACTION.DEACTIVATE_USER, targetType: 'user', targetId: id,
        payloadSummary: `Status changed to ${status}`, ipAddress: req.ip,
      });
    }

    return res.status(200).json({
      success: true,
      message: `User status updated to '${status}'.`,
      data: { uid: id, status },
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
};

/* ──────────────────── DELETE /api/admin/users/:id ──────────────────── */

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userData = userDoc.data();
    const batch = db.batch();
    batch.delete(db.collection(COLLECTIONS.USERS).doc(id));

    // Clean up company doc so re-registration works cleanly
    if (userData.role === ROLES.COMPANY) {
      const companySnap = await db.collection(COLLECTIONS.COMPANIES)
        .where('primaryContactUserId', '==', id).get();
      companySnap.forEach((d) => batch.delete(d.ref));
    }

    await batch.commit();

    // Delete Firebase Auth user — best-effort so a stale auth record never blocks re-registration
    try {
      await auth.deleteUser(id);
    } catch (authErr) {
      if (authErr.code !== 'auth/user-not-found') {
        console.error('Firebase Auth delete warning (non-critical):', authErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
      data: { uid: id },
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};

/* ──────────────────── Helpers ──────────────────── */

function generateTemporaryPassword() {
  const alpha  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower  = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const all    = alpha + lower + digits;
  const pick   = (set) => set[crypto.randomInt(0, set.length)];
  let pwd = pick(alpha) + pick(lower) + pick(digits);
  for (let i = 0; i < 9; i++) pwd += pick(all);
  return pwd;
}

/* ──────────────────── POST /api/admin/users/faculty ──────────────────── */

const provisionFaculty = async (req, res) => {
  try {
    const { email, fullName, schoolId } = req.body;
    if (!email || !fullName || !schoolId) {
      return res.status(400).json({
        success: false,
        message: 'email, fullName, and schoolId are required.',
      });
    }

    // Only one active Faculty per school (FR-1.12)
    const existing = await db.collection(COLLECTIONS.FACULTY_PROFILES)
      .where('schoolId', '==', schoolId).get();

    if (!existing.empty) {
      const activeOnes = [];
      for (const doc of existing.docs) {
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(doc.id).get();
        if (userDoc.exists && userDoc.data().status === ACCOUNT_STATUS.ACTIVE) {
          activeOnes.push(doc.id);
        }
      }
      if (activeOnes.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'This school already has an active Faculty account. Deactivate the existing one first.',
          activeFacultyUserIds: activeOnes,
        });
      }
    }

    const tempPwd = generateTemporaryPassword();
    const userRecord = await auth.createUser({
      email, password: tempPwd, displayName: fullName, emailVerified: true,
    });
    await auth.setCustomUserClaims(userRecord.uid, { role: ROLES.FACULTY });

    const now = new Date().toISOString();
    const batch = db.batch();
    batch.set(db.collection(COLLECTIONS.USERS).doc(userRecord.uid), {
      uid: userRecord.uid, email, fullName,
      role: ROLES.FACULTY, status: ACCOUNT_STATUS.ACTIVE,
      createdAt: now, updatedAt: now, lastLoginAt: null,
    });
    batch.set(db.collection(COLLECTIONS.FACULTY_PROFILES).doc(userRecord.uid), {
      userId: userRecord.uid, schoolId,
      designation: null, phoneNumber: null, createdAt: now, updatedAt: now,
    });
    await batch.commit();

    await auditLogger.log({
      actorUserId: req.user.uid, actorRole: req.user.role,
      actionType: AUDIT_ACTION.PROVISION_FACULTY, targetType: 'user', targetId: userRecord.uid,
      payloadSummary: `Provisioned Faculty for school ${schoolId}`, ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Faculty account created.',
      data: {
        uid: userRecord.uid, email, role: ROLES.FACULTY, schoolId,
        temporaryPassword: process.env.NODE_ENV === 'development' ? tempPwd : undefined,
      },
    });
  } catch (error) {
    console.error('provisionFaculty error:', error);
    return res.status(500).json({ success: false, message: 'Failed to provision Faculty.' });
  }
};

/* ──────────────────── POST /api/admin/users/tpo ──────────────────── */

const provisionTPO = async (req, res) => {
  try {
    const { email, fullName } = req.body;
    if (!email || !fullName) {
      return res.status(400).json({ success: false, message: 'email and fullName are required.' });
    }

    // Deactivate any existing active TPO (FR-1.13)
    const existing = await db.collection(COLLECTIONS.USERS)
      .where('role', '==', ROLES.TPO)
      .where('status', '==', ACCOUNT_STATUS.ACTIVE).get();

    const batch = db.batch();
    for (const doc of existing.docs) {
      batch.update(doc.ref, {
        status: ACCOUNT_STATUS.DEACTIVATED,
        updatedAt: new Date().toISOString(),
      });
    }

    const tempPwd = generateTemporaryPassword();
    const userRecord = await auth.createUser({
      email, password: tempPwd, displayName: fullName, emailVerified: true,
    });
    await auth.setCustomUserClaims(userRecord.uid, { role: ROLES.TPO });

    const now = new Date().toISOString();
    batch.set(db.collection(COLLECTIONS.USERS).doc(userRecord.uid), {
      uid: userRecord.uid, email, fullName,
      role: ROLES.TPO, status: ACCOUNT_STATUS.ACTIVE,
      createdAt: now, updatedAt: now, lastLoginAt: null,
    });
    await batch.commit();

    await auditLogger.log({
      actorUserId: req.user.uid, actorRole: req.user.role,
      actionType: AUDIT_ACTION.PROVISION_TPO, targetType: 'user', targetId: userRecord.uid,
      payloadSummary: `Provisioned TPO; deactivated ${existing.size} previous.`, ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'TPO account created.',
      data: {
        uid: userRecord.uid, email, role: ROLES.TPO,
        temporaryPassword: process.env.NODE_ENV === 'development' ? tempPwd : undefined,
      },
    });
  } catch (error) {
    console.error('provisionTPO error:', error);
    return res.status(500).json({ success: false, message: 'Failed to provision TPO.' });
  }
};

/* ──────────────────── PATCH /api/admin/companies/:companyId/approve ──────────────────── */

const approveCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const now = new Date().toISOString();

    const companyRef = db.collection(COLLECTIONS.COMPANIES).doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const primaryUserId = companyDoc.data().primaryContactUserId;
    const userRef = db.collection(COLLECTIONS.USERS).doc(primaryUserId);
    const batch = db.batch();
    batch.update(companyRef, {
      status: COMPANY_STATUS.ACTIVE,
      approvedAt: now,
      approvedBy: req.user.uid,
      updatedAt: now,
    });
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      batch.update(userRef, { status: ACCOUNT_STATUS.ACTIVE, updatedAt: now });
    }
    await batch.commit();

    await auditLogger.log({
      actorUserId: req.user.uid, actorRole: req.user.role,
      actionType: AUDIT_ACTION.APPROVE_COMPANY, targetType: 'company', targetId: companyId,
      payloadSummary: 'Company approved.', ipAddress: req.ip,
    });

    // Notify company contact — best effort
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(companyDoc.data().primaryContactUserId).get();
    if (userDoc.exists) {
      sendCompanyApprovedEmail(userDoc.data().email, companyDoc.data().companyName)
        .catch((e) => console.error('Company approved email error:', e));
    }

    return res.status(200).json({ success: true, message: 'Company approved.' });
  } catch (error) {
    console.error('approveCompany error:', error);
    return res.status(500).json({ success: false, message: 'Approval failed.' });
  }
};

/* ──────────────────── PATCH /api/admin/companies/:companyId/reject ──────────────────── */

const rejectCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { reason } = req.body;
    const now = new Date().toISOString();

    const companyRef = db.collection(COLLECTIONS.COMPANIES).doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const primaryUserId = companyDoc.data().primaryContactUserId;
    const userRef = db.collection(COLLECTIONS.USERS).doc(primaryUserId);
    const batch = db.batch();
    batch.update(companyRef, { status: COMPANY_STATUS.REJECTED, updatedAt: now });
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      batch.update(userRef, { status: ACCOUNT_STATUS.DEACTIVATED, updatedAt: now });
    }
    await batch.commit();

    await auditLogger.log({
      actorUserId: req.user.uid, actorRole: req.user.role,
      actionType: AUDIT_ACTION.REJECT_COMPANY, targetType: 'company', targetId: companyId,
      payloadSummary: reason || 'Company rejected.', ipAddress: req.ip,
    });

    // Notify company contact — best effort
    const rUserDoc = await db.collection(COLLECTIONS.USERS).doc(companyDoc.data().primaryContactUserId).get();
    if (rUserDoc.exists) {
      sendCompanyRejectedEmail(rUserDoc.data().email, companyDoc.data().companyName, reason)
        .catch((e) => console.error('Company rejected email error:', e));
    }

    return res.status(200).json({ success: true, message: 'Company rejected.' });
  } catch (error) {
    console.error('rejectCompany error:', error);
    return res.status(500).json({ success: false, message: 'Rejection failed.' });
  }
};

/* ──────────────────── GET /api/admin/companies/pending ──────────────────── */

const listPendingCompanies = async (_req, res) => {
  try {
    const snap = await db
      .collection(COLLECTIONS.COMPANIES)
      .where('status', '==', COMPANY_STATUS.PENDING_APPROVAL)
      .get();
    const companies = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ success: true, data: companies });
  } catch (error) {
    console.error('listPendingCompanies error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending companies.' });
  }
};

module.exports = {
  listUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  provisionFaculty,
  provisionTPO,
  approveCompany,
  rejectCompany,
  listPendingCompanies,
};
