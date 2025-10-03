// K6 type extensions and utilities

export interface K6Response {
  status: number;
  body: string;
  headers: Record<string, string>;
  timings: {
    duration: number;
    waiting: number;
    receiving: number;
    sending: number;
    connecting: number;
    tls_handshaking: number;
    blocked: number;
  };
}

export interface BalikonetTestData {
  username: string;
  password: string;
  shipper: string;
}

// K6 environment variables are globally available
// No need to redeclare __ENV as it's already defined by K6

// Common test utilities
export function createAuthHeaders(username: string, password: string): Record<string, string> {
  const authString = btoa(`${username}:${password}`);
  return {
    'Authorization': `Basic ${authString}`,
    'Content-Type': 'application/json',
  };
}

export function logTestResult(testName: string, success: boolean, details?: string): void {
  const emoji = success ? '✅' : '❌';
  const message = `${emoji} ${testName}${details ? `: ${details}` : ''}`;
  console.log(message);
}

export const BALIKOBOT_CONFIG = {
  BASE_URL: 'https://api.balikobot.cz',
  TIMEOUT: '10s',
  THRESHOLDS: {
    HTTP_REQ_DURATION: 'p(95)<500',
    ERROR_RATE: 'rate<0.1',
  },
  STAGES: {
    RAMP_UP: { duration: '30s', target: 5 },
    STEADY: { duration: '1m', target: 5 },
    RAMP_DOWN: { duration: '30s', target: 0 },
  },
} as const;
