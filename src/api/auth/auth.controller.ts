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
import { LoginDto, SignupDto, TUser } from "utils/types";
import { LoginSchema, SignupSchema } from "utils/schemas";
import { CookieOptions, Response } from "express";
import { GoogleOAuthGuard } from "./guards/google-oauth.guard";
import { ConfigService } from "@nestjs/config";

@Controller("auth")
export class AuthController {
   constructor(
      private readonly authService: AuthService,
      private readonly configService: ConfigService
   ) {}

   private readonly cookieOptions: CookieOptions = {
      httpOnly: true,
      sameSite: "lax",
      secure: this.configService.get("NODE_ENV") === "production",
      maxAge: 1000 * 60 * 60 * 24 * 15 // 15 days
   };

   @Public()
   @UsePipes(new ValibotPipe(SignupSchema))
   @Post("signup")
   async signup(@Body() creds: SignupDto, @Res() res: Response) {
      const { accessToken, refreshToken, boardId } =
         await this.authService.signup(creds);

      res.cookie("taskative_refreshToken", refreshToken, this.cookieOptions);
      res.setHeader("Location", "/");

      res.send({ message: "User created successfully!", accessToken, boardId });
   }

   @Unauthenticated()
   @UsePipes(new ValibotPipe(LoginSchema))
   @Post("login")
   async login(@Body() creds: LoginDto, @Res() res: Response) {
      const { accessToken, refreshToken } = await this.authService.login(creds);

      res.cookie("taskative_refreshToken", refreshToken, this.cookieOptions);
      res.setHeader("Location", "/");

      res.status(HttpStatus.OK).send({
         message: "User logged in successfully!",
         accessToken
      });
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
      @User() user: Omit<TUser, "userId"> & { sub: string },
      @Res() res: Response
   ) {
      const { accessToken, refreshToken } =
         await this.authService.generateTokens(user);

      res.cookie("taskative_refreshToken", refreshToken, this.cookieOptions);
      res.setHeader("Location", "/");

      res.send({
         message: "User logged in with Google successfully!",
         accessToken
      });
   }

   @Post("logout")
   async logout(@User() { userId }: TUser, @Res() res: Response) {
      res.clearCookie("taskative_refreshToken");
      await this.authService.logout(userId);
      res.setHeader("Location", "/login");
      res.status(HttpStatus.OK).send({
         message: "User logged out successfully!"
      });
   }
}
