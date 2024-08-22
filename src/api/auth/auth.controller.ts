import {
   Body,
   Controller,
   HttpStatus,
   Post,
   Res,
   UsePipes
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public, User } from "src/utils/decorators";
import { ValibotPipe } from "src/utils/pipes";
import { LoginDto, SignupDto, UserDto } from "src/utils/types";
import { LoginSchema, SignupSchema } from "src/utils/schemas";
import { Response } from "express";

@Controller("auth")
export class AuthController {
   constructor(private readonly authService: AuthService) {}

   @Public()
   @UsePipes(new ValibotPipe(LoginSchema))
   @Post("login")
   async login(@Body() creds: LoginDto, @Res() res: Response) {
      const { accessToken, refreshToken } = await this.authService.login(creds);

      res.cookie("taskative_refreshToken", refreshToken, {
         httpOnly: true,
         sameSite: "lax",
         secure: true
      });

      res.status(HttpStatus.OK).send({ accessToken });
   }

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

      res.send({ accessToken });
   }

   @Post("logout")
   async logout(@User() { userId }: UserDto, @Res() res: Response) {
      res.clearCookie("taskative_refreshToken");
      await this.authService.logout(userId);
      res.status(HttpStatus.NO_CONTENT).send();
   }
}
