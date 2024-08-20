import {
   createParamDecorator,
   SetMetadata,
   ExecutionContext
} from "@nestjs/common";

/**
 * Mark a route as public
 */
export const Public = () => SetMetadata("is_public", true);

/**
 * Get the user object from the request
 */
export const User = createParamDecorator((_, ctx: ExecutionContext) => {
   const request = ctx.switchToHttp().getRequest();
   return request.user;
});
