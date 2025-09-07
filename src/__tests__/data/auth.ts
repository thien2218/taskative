// Valid payloads
export const sessionTestOpts = {
  httpOnly: true,
  secure: false,
  sameSite: "Strict" as const,
  maxAge: 1800, // 20 minutes + 10 minute buffer
};

export const authTestPayload = {
  // Used for log in and registering
  email: "john.doe@taskative.com",
  password: "SecurePassword123!",
};

export const resetTestPayload = {
  // Used for forgot password and resetting
  forgotPassword: {
    email: "user@taskative.com",
  },
  resetPassword: {
    token: "valid-reset-token-abc123",
    newPassword: "NewSecurePassword789!",
  },
};

export const requestBaseTestOpts = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

// Test data
export const testUser = {
  id: "user123",
  email: "test@example.com",
  passwordHash: "hashed_password123",
  firstName: "Test",
  lastName: "User",
  username: "testuser",
  profileImageUrl: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

export const testSession = {
  id: "session123",
  userId: "user123",
  status: "active",
  createdAt: "2025-01-01T00:00:00.000Z",
  expiresAt: "2025-01-01T01:00:00.000Z",
  revokedAt: null,
};

export const testPasswordResetToken = {
  id: "token123",
  userId: "user123",
  token: "valid-reset-token-123",
  expiresAt: "2025-01-01T01:00:00.000Z",
  usedAt: null,
  createdAt: "2025-01-01T00:00:00.000Z",
};
