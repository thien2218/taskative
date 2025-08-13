export interface SessionPayload {
  sessionId: string;
  userId: string;
  email: string;
}

export interface SessionJWTPayload {
  sessionId: string;
  userId: string;
  email: string;
  exp: number;
  iat: number;
}

export interface CreateSessionRequest {
  userId: string;
  email: string;
}

export interface SessionResult {
  success: true;
  sessionToken: string;
}

export interface SessionError {
  success: false;
  error: string;
}
