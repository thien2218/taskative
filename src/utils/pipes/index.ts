import {
   PipeTransform,
   Injectable,
   BadRequestException,
   ArgumentMetadata
} from "@nestjs/common";
import { ObjectSchema, safeParse } from "valibot";

@Injectable()
export class ValibotPipe implements PipeTransform {
   constructor(private readonly schema: ObjectSchema<any, any>) {}

   transform(value: any, metadata: ArgumentMetadata) {
      if (metadata.type === "body") {
         const result = safeParse(this.schema, value);

         if (result.success) {
            return result.output;
         } else {
            throw new BadRequestException(result.issues[0].message);
         }
      }

      return value;
   }
}
