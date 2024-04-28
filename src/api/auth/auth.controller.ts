import { Body, Controller, Post, UsePipes } from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
   // LoginDto,
   // LoginSchema,
   SignupDto,
   SignupSchema
} from "@/tools/schemas/auth.schema";
import { ValibotPipe } from "@/tools/pipes/valibot.pipe";

@Controller("auth")
export class AuthController {
   constructor(private readonly authService: AuthService) {}

   @Post("signup")
   @UsePipes(new ValibotPipe(SignupSchema))
   async signup(@Body() signupDto: SignupDto) {
      return this.authService.signup(signupDto);
   }

   // @Post("login")
   // @UsePipes(new ValibotPipe(LoginSchema))
   // async login(@Body() loginDto: LoginDto) {
   //    return this.authService.login(loginDto);
   // }
}
