import {
   Body,
   Controller,
   Post,
   Res,
   UseGuards,
   UsePipes
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginSchema, SignupSchema } from "@/tools/schemas/auth.schema";
import { ValibotPipe } from "@/tools/pipes/valibot.pipe";
import { FastifyReply } from "fastify";
import { User } from "@/tools/decorators/user.decorator";
import { AccessGuard } from "./guards/access.guard";
import { RefreshGuard } from "./guards/refresh.guard";
import { SelectUserDto, UserRefresh } from "@/tools/types/user.type";
import { LoginDto, SignupDto } from "@/tools/types/auth.type";

@Controller("auth")
export class AuthController {
   constructor(private readonly authService: AuthService) {}

   // PUBLIC METHODS
   @Post("signup")
   @UsePipes(new ValibotPipe(SignupSchema))
   async signup(@Body() signupDto: SignupDto, @Res() res: FastifyReply) {
      try {
         const { refreshToken, ...rest } =
            await this.authService.signup(signupDto);
         this.setRefreshTokenCookie(res, refreshToken);
         res.send(rest);
      } catch (e) {
         res.send(e);
      }
   }

   @Post("login")
   @UsePipes(new ValibotPipe(LoginSchema))
   async login(@Body() loginDto: LoginDto, @Res() res: FastifyReply) {
      try {
         const { refreshToken, ...rest } =
            await this.authService.login(loginDto);
         this.setRefreshTokenCookie(res, refreshToken);
         res.code(200).send(rest);
      } catch (e) {
         res.send(e);
      }
   }

   @Post("logout")
   @UseGuards(AccessGuard)
   async logout(@User() { id }: SelectUserDto, @Res() res: FastifyReply) {
      try {
         const message = await this.authService.logout(id);
         res.clearCookie("taskative-refresh-token", {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "prod"
         });
         res.code(200).send({ message });
      } catch (e) {
         res.send(e);
      }
   }

   @Post("refresh")
   @UseGuards(RefreshGuard)
   async refresh(@User() userRefresh: UserRefresh, @Res() res: FastifyReply) {
      try {
         const { refreshToken, ...rest } =
            await this.authService.refresh(userRefresh);

         if (refreshToken) this.setRefreshTokenCookie(res, refreshToken);
         res.code(200).send(rest);
      } catch (e) {
         res.send(e);
      }
   }

   // PRIVATE HELPERS
   private setRefreshTokenCookie(res: FastifyReply, refreshToken: string) {
      res.setCookie("taskative-refresh-token", refreshToken, {
         path: "/",
         httpOnly: true,
         secure: process.env.NODE_ENV === "prod",
         sameSite: "lax",
         maxAge: 60 * 60 * 24 * 30 // 30 days
      });
   }
}
