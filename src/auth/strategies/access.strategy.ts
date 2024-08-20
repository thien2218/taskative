import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, "access") {
   constructor() {
      super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         ignoreExpiration: false,
         passReqToCallback: true,
         secretOrKey: ""
      });
   }

   async validate(payload: any) {
      return { userId: payload.sub, username: payload.username };
   }
}
