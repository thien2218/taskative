export interface AuthResult {
  success: true;
  sessionToken: string;
}

export interface AuthError {
  success: false;
  error: string;
  status: number;
}

export interface PasswordResetResult {
  success: true;
}

export interface PasswordResetError {
  success: false;
  error: string;
  status: number;
}
