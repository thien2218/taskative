import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "src/utils/schemas";

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, "access") {
   constructor(private readonly configService: ConfigService) {
      super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         ignoreExpiration: true,
         passReqToCallback: true,
         secretOrKey: configService.get("JWT_SECRET")
      });
   }

   async validate({ sub, exp, ...rest }: JwtPayload) {
      if (Date.now() >= exp) {
         return { id: sub, ...rest };
      } else {
         throw new UnauthorizedException("Access token expired");
      }
   }
}
