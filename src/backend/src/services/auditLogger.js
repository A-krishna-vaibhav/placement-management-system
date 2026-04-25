const { db } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');

async function log({ actorUserId, actorRole, actionType, targetType, targetId, payloadSummary, ipAddress }) {
  const entry = {
    actorUserId,
    actorRole,
    actionType,
    targetType:     targetType    || null,
    targetId:       targetId      || null,
    payloadSummary: payloadSummary ? String(payloadSummary).slice(0, 500) : null,
    ipAddress:      ipAddress     || null,
    createdAt:      new Date().toISOString(),
  };
  await db.collection(COLLECTIONS.AUDIT_LOGS).add(entry);
  return entry;
}

module.exports = { log };
