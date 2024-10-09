import {
   Body,
   Controller,
   Get,
   HttpCode,
   HttpStatus,
   Patch,
   UsePipes
} from "@nestjs/common";
import { UserService } from "./user.service";
import { UpdateUserDto, TUser } from "utils/types";
import { User } from "utils/decorators";
import { ValibotPipe } from "utils/pipes";
import { UpdateUserSchema } from "utils/schemas";

@Controller("user")
export class UserController {
   constructor(private readonly userService: UserService) {}

   @Get()
   async findProfile(@User() { userId }: TUser) {
      return this.userService.findProfile(userId);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @UsePipes(new ValibotPipe(UpdateUserSchema))
   @Patch()
   async updateProfile(
      @User() { userId }: TUser,
      @Body() updateUserSchema: UpdateUserDto
   ) {
      return this.userService.updateProfile(userId, updateUserSchema);
   }
}
