import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";
import { JwtPayload } from "src/utils/types";

@Injectable()
export class AccessGuard extends AuthGuard("access") {
   constructor(
      private readonly reflector: Reflector,
      private readonly jwtService: JwtService
   ) {
      super();
   }

   canActivate(context: ExecutionContext) {
      const isPublic = this.reflector.getAllAndOverride<boolean>("is_public", [
         context.getHandler(),
         context.getClass()
      ]);

      if (isPublic) return true;

      const isForUnauthenticated = this.reflector.getAllAndOverride<boolean>(
         "is_for_unauthenticated",
         [context.getHandler(), context.getClass()]
      );

      try {
         const request = context.switchToHttp().getRequest();
         const refreshToken = request.cookies["taskative_refreshToken"];
         const { exp } = this.jwtService.verify<JwtPayload>(refreshToken);

         if (exp * 1000 < Date.now()) {
            if (isForUnauthenticated) return true;
            return false;
         }
      } catch {
         if (isForUnauthenticated) return true;
         return false;
      }

      return super.canActivate(context);
   }
}
