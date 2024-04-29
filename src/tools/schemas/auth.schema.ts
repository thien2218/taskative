import {
   email,
   maxLength,
   minLength,
   object,
   string,
   Input,
   nullable,
   optional,
   Output,
   transform,
   custom
} from "valibot";

/**
 * Schemas
 */
export const SignupSchema = transform(
   object(
      {
         email: string([email()]),
         password: string([minLength(8), maxLength(32)]),
         confirmPassword: string([minLength(8), maxLength(32)]),
         username: string([minLength(3), maxLength(24)]),
         profileImage: optional(nullable(string()), null)
      },
      [
         custom(
            ({ password, confirmPassword }) => password === confirmPassword,
            "Passwords do not match"
         )
      ]
   ),
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   ({ confirmPassword, ...rest }) => {
      return rest;
   }
);

export const LoginSchema = object({
   email: string([email()]),
   password: string([minLength(8), maxLength(32)])
});

/**
 * Types
 */
export type SignupDto = Output<typeof SignupSchema>;
export type LoginDto = Input<typeof LoginSchema>;
