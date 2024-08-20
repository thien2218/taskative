import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { ObjectSchema, parse } from "valibot";

@Injectable()
export class ValibotPipe implements PipeTransform {
   constructor(private readonly schema: ObjectSchema<any, any>) {}

   transform(value: any) {
      try {
         const parsed = parse(this.schema, value);
         return parsed;
      } catch (error) {
         throw new BadRequestException(error);
      }
   }
}
