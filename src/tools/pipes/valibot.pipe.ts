import {
   ArgumentMetadata,
   BadRequestException,
   Injectable,
   PipeTransform
} from "@nestjs/common";
import { ObjectSchema, safeParse } from "valibot";

@Injectable()
export class ValibotPipe implements PipeTransform {
   constructor(private readonly schema: ObjectSchema<any>) {}

   transform(value: object, { type }: ArgumentMetadata) {
      if (type === "body") {
         const parsed = safeParse(this.schema, value);

         if (parsed.success) {
            return parsed.output;
         } else {
            throw new BadRequestException(parsed.issues);
         }
      }

      return value;
   }
}
