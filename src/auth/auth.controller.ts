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
import { LoginDto, SignupDto } from "src/utils/types";
import { LoginSchema, SignupSchema } from "src/utils/schemas";

@Controller("auth")
export class AuthController {
   constructor(private readonly authService: AuthService) {}

   @Public()
   @UsePipes(new ValibotPipe(LoginSchema))
   @Post("login")
   async login(@Body() creds: LoginDto): Promise<{ accessToken: string }> {
      return this.authService.login(creds);
   }

   @Public()
   @UsePipes(new ValibotPipe(SignupSchema))
   @Post("signup")
   async signup(@Body() creds: SignupDto): Promise<{ accessToken: string }> {
      return this.authService.signup(creds);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @Post("logout")
   async logout() {
      return this.authService.logout();
   }
}
