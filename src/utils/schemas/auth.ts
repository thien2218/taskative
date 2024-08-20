import {
   check,
   email,
   forward,
   InferInput,
   maxLength,
   minLength,
   nonEmpty,
   object,
   pipe,
   string,
   transform
} from "valibot";

/**
 * Schemas
 */
export const LoginCredsSchema = object({
   email: pipe(
      string(),
      nonEmpty("Email is required"),
      email("Invalid email address")
   ),
   password: pipe(string(), nonEmpty("Please enter your password"))
});

export const SignupCredsSchema = pipe(
   object({
      email: pipe(
         string(),
         nonEmpty("Email is required"),
         email("Invalid email address"),
         maxLength(255, "Email address is too long")
      ),
      password: pipe(
         string(),
         nonEmpty("Password is required"),
         maxLength(20, "Password cannot be longer than 20 characters"),
         minLength(6, "Password must be at least 6 characters long")
      ),
      confirmPassword: string()
   }),
   forward(
      check(
         (creds) => creds.password === creds.confirmPassword,
         "Passwords do not match"
      ),
      ["confirmPassword"]
   ),
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   transform(({ confirmPassword, ...rest }) => {
      return rest;
   })
);

/**
 * Types
 */
export type Credentials = InferInput<typeof LoginCredsSchema>;
export type AuthTokens = {
   accessToken: string;
   refreshToken: string;
};
export type AccessToken = Omit<AuthTokens, "refreshToken">;
