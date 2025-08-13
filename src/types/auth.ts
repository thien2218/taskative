export interface AuthResult {
  success: true;
  sessionToken: string;
}

export interface AuthError {
  success: false;
  error: string;
  status: number;
}
