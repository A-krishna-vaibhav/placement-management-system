/**
 * Admin Controller
 * ────────────────
 * Handles:
 *   GET   /api/admin/users          — list users (filterable)
 *   PATCH /api/admin/users/:id/role  — update user role
 *   PATCH /api/admin/users/:id/status — activate / deactivate
 */

const { auth, db } = require('../config/firebase');
const { COLLECTIONS, ROLES } = require('../config/constants');
const { handleValidationErrors } = require('../utils/validationHelper');

/* ────────────── GET /api/admin/users ────────────── */

const listUsers = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { role, status, page = 1, limit = 20 } = req.query;

    let query = db.collection(COLLECTIONS.USERS);

    if (role) {
      query = query.where('role', '==', role);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const users = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
        status: data.status,
        isVerified: data.isVerified,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    // Simple in-memory pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedUsers = users.slice(startIndex, startIndex + parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        users: paginatedUsers,
        total: users.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(users.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users.',
    });
  }
};

/* ────────────── PATCH /api/admin/users/:id/role ────────────── */

const updateUserRole = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { id } = req.params;
    const { role } = req.body;

    // Check user exists
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Update Firestore
    await db.collection(COLLECTIONS.USERS).doc(id).update({
      role,
      updatedAt: new Date().toISOString(),
    });

    // Update Firebase Auth custom claims
    await auth.setCustomUserClaims(id, { role });

    return res.status(200).json({
      success: true,
      message: `User role updated to '${role}'.`,
      data: { uid: id, role },
    });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role.',
    });
  }
};

/* ────────────── PATCH /api/admin/users/:id/status ────────────── */

const updateUserStatus = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { id } = req.params;
    const { status } = req.body;

    // Check user exists
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Update Firestore
    await db.collection(COLLECTIONS.USERS).doc(id).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    // If deactivated, also disable in Firebase Auth
    if (status === 'Deactivated') {
      await auth.updateUser(id, { disabled: true });
    } else if (status === 'Active') {
      await auth.updateUser(id, { disabled: false });
    }

    return res.status(200).json({
      success: true,
      message: `User status updated to '${status}'.`,
      data: { uid: id, status },
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status.',
    });
  }
};

/* ────────────── DELETE /api/admin/users/:id ────────────── */

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check user exists in Firestore
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Delete from Firestore
    await db.collection(COLLECTIONS.USERS).doc(id).delete();

    // Delete from Firebase Auth
    await auth.deleteUser(id);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
      data: { uid: id },
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user.',
    });
  }
};

module.exports = {
  listUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
};
