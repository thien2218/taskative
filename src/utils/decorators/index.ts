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
 * Mark a route as accessible only to unauthenticated users
 */
export const Unauthenticated = () =>
   SetMetadata("is_for_unauthenticated", true);

/**
 * Get the user object from the request
 */
export const User = createParamDecorator((_, ctx: ExecutionContext) => {
   const request = ctx.switchToHttp().getRequest();
   return request.user;
});
