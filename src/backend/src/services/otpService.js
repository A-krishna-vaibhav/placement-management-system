const crypto = require('crypto');
const { db } = require('../config/firebase');
const { COLLECTIONS, OTP_POLICY } = require('../config/constants');

function generateNumericOTP(length = OTP_POLICY.LENGTH) {
  const max = 10 ** length;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(length, '0');
}

async function issueOTP(userId, email) {
  const code = generateNumericOTP();
  const now = Date.now();
  const expiresAt = now + OTP_POLICY.TTL_MINUTES * 60 * 1000;

  // Overwrite any existing code for this user
  await db.collection(COLLECTIONS.OTP_CODES).doc(userId).set({
    userId,
    email,
    code,
    attempts: 0,
    createdAt: now,
    expiresAt,
  });

  return { code, expiresAt };
}

async function verifyOTP(userId, submittedCode) {
  const ref = db.collection(COLLECTIONS.OTP_CODES).doc(userId);
  const doc = await ref.get();
  if (!doc.exists) {
    return { ok: false, reason: 'no-otp' };
  }
  const data = doc.data();

  if (Date.now() > data.expiresAt) {
    await ref.delete();
    return { ok: false, reason: 'expired' };
  }

  if (data.attempts >= OTP_POLICY.MAX_ATTEMPTS) {
    await ref.delete();
    return { ok: false, reason: 'too-many-attempts' };
  }

  if (data.code !== submittedCode) {
    await ref.update({ attempts: data.attempts + 1 });
    const remaining = OTP_POLICY.MAX_ATTEMPTS - (data.attempts + 1);
    if (remaining <= 0) {
      await ref.delete();
      return { ok: false, reason: 'too-many-attempts' };
    }
    return { ok: false, reason: 'wrong-code', attemptsRemaining: remaining };
  }

  // Correct — single use
  await ref.delete();
  return { ok: true };
}

module.exports = { issueOTP, verifyOTP };
