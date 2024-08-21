import { Controller, Get } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserDto } from "src/utils/types";
import { User } from "src/utils/decorators";

@Controller("user")
export class UserController {
   constructor(private readonly userService: UserService) {}

   @Get()
   async getUserInfo(@User() { userId }: UserDto) {
      return this.userService.getUserInfo(userId);
   }
}
