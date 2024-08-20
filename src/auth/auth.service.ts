import { Injectable } from "@nestjs/common";
import { AuthTokens, Credentials } from "src/utils/schemas";

@Injectable()
export class AuthService {
   constructor() {}

   async login({ email, password }: Credentials): Promise<AuthTokens> {
      return;
   }

   async signup({ email, password }: Credentials): Promise<AuthTokens> {
      return;
   }

   async logout() {
      return;
   }
}
