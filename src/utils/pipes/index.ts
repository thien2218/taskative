import {
   PipeTransform,
   Injectable,
   BadRequestException,
   ArgumentMetadata
} from "@nestjs/common";
import { GenericSchema, safeParse } from "valibot";

@Injectable()
export class ValibotPipe implements PipeTransform {
   constructor(private readonly schema: GenericSchema<any, any>) {}

   transform(value: any, metadata: ArgumentMetadata) {
      if (metadata.type === "body" || metadata.type === "query") {
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
