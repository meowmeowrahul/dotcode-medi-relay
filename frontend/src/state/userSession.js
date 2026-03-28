const DEFAULT_USER = {
  name: 'Dr. Aria Patel',
  role: 'doctor',
  did: 'DOC-DEMO-001',
  pid: 'PID-DEMO-001',
  hospitalName: 'City Care Medical Center',
  profileImage: '',
};

let sessionState = {
  isAuthenticated: true,
  user: DEFAULT_USER,
};

const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener(sessionState));
}

export function getSessionState() {
  return sessionState;
}

export function subscribeSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSessionState(partial) {
  sessionState = {
    ...sessionState,
    ...partial,
  };
  emit();
}

export function setUserProfile(profile) {
  sessionState = {
    ...sessionState,
    user: {
      ...(sessionState.user || DEFAULT_USER),
      ...profile,
    },
    isAuthenticated: true,
  };
  emit();
}

export function clearSessionState() {
  sessionState = {
    isAuthenticated: false,
    user: null,
  };
  emit();
}

export function restoreDemoSession() {
  sessionState = {
    isAuthenticated: true,
    user: DEFAULT_USER,
  };
  emit();
}
