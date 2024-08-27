import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";
import { Request } from "express";
import { JwtPayload, UserDto } from "src/utils/types";

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, "access") {
   constructor(
      private readonly configService: ConfigService,
      private readonly authService: AuthService
   ) {
      super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         ignoreExpiration: true,
         secretOrKey: configService.get<string>("JWT_SECRET"),
         passReqToCallback: true
      });
   }

   async validate(
      req: Request,
      { sub, exp, ...rest }: JwtPayload
   ): Promise<UserDto> {
      if (exp * 1000 < Date.now()) {
         const curRefreshToken = req.cookies[
            "taskative_refreshToken"
         ] as string;

         const { accessToken, refreshToken } = await this.authService.refresh(
            sub,
            curRefreshToken
         );

         req.res?.setHeader("Authorization", `Bearer ${accessToken}`);

         if (refreshToken) {
            req.res?.cookie("taskative_refreshToken", refreshToken, {
               httpOnly: true,
               sameSite: "lax",
               secure: true
            });
         }
      }

      return { userId: sub, ...rest };
   }
}
