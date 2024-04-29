import {
   Body,
   Controller,
   Post,
   Res,
   UnauthorizedException,
   UseGuards,
   UsePipes
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
   // LoginDto,
   // LoginSchema,
   SignupDto,
   SignupSchema
} from "@/tools/schemas/auth.schema";
import { ValibotPipe } from "@/tools/pipes/valibot.pipe";
import { FastifyReply } from "fastify";
import { User } from "@/tools/decorators/user.decorator";
import { AccessGuard } from "./guards/access.guard";
import { SelectUserDto } from "@/tools/schemas/user.schema";

@Controller("auth")
export class AuthController {
   constructor(private readonly authService: AuthService) {}

   @Post("signup")
   @UsePipes(new ValibotPipe(SignupSchema))
   async signup(@Body() signupDto: SignupDto, @Res() res: FastifyReply) {
      const { refreshToken, ...rest } =
         await this.authService.signup(signupDto);

      this.setRefreshTokenCookie(res, refreshToken);
      res.send(rest);
   }

   @Post("logout")
   @UseGuards(AccessGuard)
   async logout(@User() { id }: SelectUserDto, @Res() res: FastifyReply) {
      await this.authService
         .logout(id)
         .then((message: string) => {
            res.clearCookie("taskative-refresh-token", {
               path: "/",
               httpOnly: true,
               secure: process.env.NODE_ENV === "prod"
            });
            res.send({ message });
         })
         .catch((e: UnauthorizedException) => {
            res.status(401).send({ message: e.message });
         });
   }

   // @Post("login")
   // @UsePipes(new ValibotPipe(LoginSchema))
   // async login(@Body() loginDto: LoginDto) {
   //    return this.authService.login(loginDto);
   // }

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
