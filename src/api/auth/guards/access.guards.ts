import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class AccessGuard extends AuthGuard("access") {
   constructor(private reflector: Reflector) {
      super();
   }

   canActivate(context: ExecutionContext) {
      const isPublic = this.reflector.getAllAndOverride<boolean>("is_public", [
         context.getHandler(),
         context.getClass()
      ]);

      if (isPublic) return true;

      const request = context.switchToHttp().getRequest();
      const refreshToken = request.cookies["taskative_refreshToken"];

      if (!refreshToken) return false;

      return super.canActivate(context);
   }
}
