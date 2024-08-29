import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";
import { AuthService } from "../auth.service";
import { ConfigService } from "@nestjs/config";
import { GoogleOAuthProfile } from "utils/types";

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy) {
   constructor(
      private readonly configService: ConfigService,
      private readonly authService: AuthService
   ) {
      super({
         clientID: configService.get<string>("GOOGLE_CLIENT_ID"),
         clientSecret: configService.get<string>("GOOGLE_CLIENT_SECRET"),
         callbackURL: configService.get<string>("GOOGLE_CALLBACK_URL"),
         scope: ["email", "profile"]
      });
   }

   async validate(
      _: any,
      __: any,
      profile: GoogleOAuthProfile,
      done: (err: any, user: any) => void
   ) {
      const { emails, name, photos } = profile;

      const user = await this.authService.validateOAuthUser({
         email: emails[0].value,
         firstName: name.givenName,
         lastName: name.familyName,
         profileImage: photos[0].value,
         provider: "google"
      });

      done(null, user);
   }
}
