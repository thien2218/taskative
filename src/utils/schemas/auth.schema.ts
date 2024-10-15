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
   toLowerCase,
   transform,
   url
} from "valibot";

const EmailSchema = pipe(
   string(),
   email("Invalid email address"),
   maxLength(63, "Email address is too long"),
   toLowerCase(),
   check(
      (email) => !email.includes("+"),
      "Email address cannot contain a plus sign"
   )
);

export const LoginSchema = object({
   email: EmailSchema,
   password: pipe(
      string(),
      minLength(6, "Password must be at least 6 characters long"),
      maxLength(20, "Password cannot be longer than 20 characters"),
      nonEmpty("Please enter your password")
   )
});

export const SignupSchema = pipe(
   object({
      email: EmailSchema,
      firstName: pipe(
         string(),
         nonEmpty("First name is required"),
         maxLength(30, "First name cannot be longer than 30 characters")
      ),
      lastName: pipe(
         string(),
         nonEmpty("Last name is required"),
         maxLength(30, "Last name cannot be longer than 30 characters")
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
