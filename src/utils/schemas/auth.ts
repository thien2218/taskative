import {
   check,
   email,
   forward,
   maxLength,
   minLength,
   nonEmpty,
   nullable,
   object,
   pipe,
   string,
   transform
} from "valibot";

export const LoginSchema = object({
   email: pipe(
      string(),
      nonEmpty("Email is required"),
      email("Invalid email address")
   ),
   password: pipe(string(), nonEmpty("Please enter your password"))
});

export const SignupSchema = pipe(
   object({
      email: pipe(
         string(),
         nonEmpty("Email is required"),
         email("Invalid email address"),
         maxLength(255, "Email address is too long")
      ),
      profileImage: nullable(string(), null),
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

export const JwtPayloadSchema = pipe(
   object({
      id: string(),
      email: string(),
      firstName: string(),
      lastName: string()
   }),
   transform(({ id, ...rest }) => {
      return { sub: id, ...rest };
   })
);
