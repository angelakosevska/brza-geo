const BREAK_MS = 120000;
const LATE_GRACE_MS = 150;
const DISCONNECT_GRACE_MS = 60000;
const FORCE_SUBMIT_WAIT_MS = 5000;

const runtime = new Map();

function getRuntime(roomCode) {
  if (!runtime.has(roomCode)) {
    runtime.set(roomCode, {
      roundTO: null,
      breakTO: null,
      ending: false,
      breakEndsAt: null,
      gen: 0,
    });
  }
  return runtime.get(roomCode);
}

function clearAllTimers(rt) {
  if (!rt) return;
  if (rt.roundTO) clearTimeout(rt.roundTO);
  if (rt.breakTO) clearTimeout(rt.breakTO);
  rt.roundTO = null;
  rt.breakTO = null;
}

module.exports = {
  BREAK_MS,
  LATE_GRACE_MS,
  DISCONNECT_GRACE_MS,
  FORCE_SUBMIT_WAIT_MS,
  getRuntime,
  clearAllTimers,
  runtime,
};
