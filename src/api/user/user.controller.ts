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
import { UpdateUserDto, UserDto } from "utils/types";
import { User } from "utils/decorators";
import { ValibotPipe } from "utils/pipes";
import { UpdateUserSchema } from "utils/schemas";

@Controller("user")
export class UserController {
   constructor(private readonly userService: UserService) {}

   @Get()
   async findOne(@User() { userId }: UserDto) {
      return this.userService.findOne(userId);
   }

   @HttpCode(HttpStatus.NO_CONTENT)
   @UsePipes(new ValibotPipe(UpdateUserSchema))
   @Patch()
   async update(
      @User() { userId }: UserDto,
      @Body() updateUserSchema: UpdateUserDto
   ) {
      return this.userService.update(userId, updateUserSchema);
   }
}
