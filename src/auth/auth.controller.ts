import {
   Body,
   Controller,
   HttpCode,
   HttpStatus,
   Post,
   UsePipes
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "src/utils/decorators";
import { ValibotPipe } from "src/utils/pipes";
import {
   AccessToken,
   Credentials,
   LoginCredsSchema,
   SignupCredsSchema
} from "src/utils/schemas";

@Controller("auth")
export class AuthController {
   constructor(private readonly authService: AuthService) {}

   @Public()
   @UsePipes(new ValibotPipe(LoginCredsSchema))
   @Post("login")
   async login(@Body() credentials: Credentials): Promise<AccessToken> {
      return this.authService.login(credentials);
   }

   @Public()
   @UsePipes(new ValibotPipe(SignupCredsSchema))
   @Post("signup")
   async signup(@Body() credentials: Credentials): Promise<AccessToken> {
      return this.authService.signup(credentials);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @Post("logout")
   async logout() {
      return this.authService.logout();
   }
}
