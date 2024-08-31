import {
   Body,
   Controller,
   Get,
   HttpStatus,
   Post,
   Res,
   UseGuards,
   UsePipes
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public, Unauthenticated, User } from "utils/decorators";
import { ValibotPipe } from "utils/pipes";
import { LoginDto, SignupDto, UserDto } from "utils/types";
import { LoginSchema, SignupSchema } from "utils/schemas";
import { Response } from "express";
import { GoogleOAuthGuard } from "./guards/google-oauth.guard";

@Controller("auth")
export class AuthController {
   constructor(private readonly authService: AuthService) {}

   @Public()
   @UsePipes(new ValibotPipe(SignupSchema))
   @Post("signup")
   async signup(@Body() creds: SignupDto, @Res() res: Response) {
      const { accessToken, refreshToken } =
         await this.authService.signup(creds);

      res.cookie("taskative_refreshToken", refreshToken, {
         httpOnly: true,
         sameSite: "lax",
         secure: true
      });

      res.setHeader("Authorization", `Bearer ${accessToken}`);
      res.send();
   }

   @Unauthenticated()
   @UsePipes(new ValibotPipe(LoginSchema))
   @Post("login")
   async login(@Body() creds: LoginDto, @Res() res: Response) {
      const { accessToken, refreshToken } = await this.authService.login(creds);

      res.cookie("taskative_refreshToken", refreshToken, {
         httpOnly: true,
         sameSite: "lax",
         secure: true
      });

      res.setHeader("Authorization", `Bearer ${accessToken}`);
      res.status(HttpStatus.OK).send();
   }

   @Unauthenticated()
   @UseGuards(GoogleOAuthGuard)
   @Get("google/login")
   async googleLogin() {
      return { message: "Logging in with Google..." };
   }

   @Unauthenticated()
   @UseGuards(GoogleOAuthGuard)
   @Get("google/callback")
   async googleCallback(
      @User() user: Omit<UserDto, "userId"> & { sub: string },
      @Res() res: Response
   ) {
      const { accessToken, refreshToken } =
         await this.authService.generateTokens(user);

      res.cookie("taskative_refreshToken", refreshToken, {
         httpOnly: true,
         sameSite: "lax",
         secure: true
      });

      res.setHeader("Authorization", `Bearer ${accessToken}`);
      res.send();
   }

   @Post("logout")
   async logout(@User() { userId }: UserDto, @Res() res: Response) {
      res.clearCookie("taskative_refreshToken");
      await this.authService.logout(userId);
      res.status(HttpStatus.OK).send();
   }
}
