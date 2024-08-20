import { Controller, Get, Param } from "@nestjs/common";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
   constructor(private readonly userService: UserService) {}

   @Get()
   async findMany() {
      return this.userService.findMany();
   }

   @Get(":id")
   async findOne(@Param("id") id: string) {
      return this.userService.findOne(id);
   }
}
