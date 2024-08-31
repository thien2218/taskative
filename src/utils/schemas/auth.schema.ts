import {
   check,
   email,
   forward,
   maxLength,
   minLength,
   nonEmpty,
   object,
   optional,
   pipe,
   startsWith,
   string,
   transform,
   url
} from "valibot";

export const LoginSchema = object({
   email: pipe(
      string(),
      nonEmpty("Email is required"),
      email("Invalid email address")
   ),
   password: pipe(
      string(),
      minLength(6, "Password must be at least 6 characters long"),
      maxLength(20, "Password cannot be longer than 20 characters"),
      nonEmpty("Please enter your password")
   )
});

export const SignupSchema = pipe(
   object({
      email: pipe(
         string(),
         nonEmpty("Email is required"),
         email("Invalid email address"),
         maxLength(255, "Email address is too long")
      ),
      firstName: pipe(
         string(),
         nonEmpty("First name is required"),
         maxLength(32, "First name cannot be longer than 32 characters")
      ),
      lastName: pipe(
         string(),
         nonEmpty("Last name is required"),
         maxLength(32, "Last name cannot be longer than 32 characters")
      ),
      password: pipe(
         string(),
         nonEmpty("Password is required"),
         maxLength(20, "Password cannot be longer than 20 characters"),
         minLength(6, "Password must be at least 6 characters long")
      ),
      confirmPassword: string(),
      profileImage: optional(
         pipe(
            string(),
            url("Invalid profile image URL"),
            startsWith("https://", "Profile image URL must be secure")
         )
      )
   }),
   forward(
      check(
         (creds) => creds.password === creds.confirmPassword,
         "Passwords do not match"
      ),
      ["confirmPassword"]
   ),
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   transform(({ confirmPassword, ...rest }) => rest)
);
