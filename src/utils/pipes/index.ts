import {
   PipeTransform,
   Injectable,
   BadRequestException,
   ArgumentMetadata
} from "@nestjs/common";
import { ObjectSchema, parse } from "valibot";

@Injectable()
export class ValibotPipe implements PipeTransform {
   constructor(private readonly schema: ObjectSchema<any, any>) {}

   transform(value: any, metadata: ArgumentMetadata) {
      try {
         if (metadata.type === "body") {
            const parsed = parse(this.schema, value);
            return parsed;
         }

         return value;
      } catch (error) {
         throw new BadRequestException(error);
      }
   }
}

@Injectable()
export class PaginationQueryPipe implements PipeTransform {
   transform(value: any) {
      const limit = parseInt(value.limit, 10);
      const page = parseInt(value.page, 10);

      if (isNaN(limit)) {
         throw new BadRequestException("QUERY PARAM: limit must be a number");
      } else if (limit < 5 || limit > 100) {
         throw new BadRequestException(
            "QUERY PARAM: limit must be between 5 and 100"
         );
      } else if (limit % 5 !== 0) {
         throw new BadRequestException(
            "QUERY PARAM: limit must be a multiple of 5"
         );
      }

      if (isNaN(page)) {
         throw new BadRequestException("QUERY PARAM: page must be a number");
      } else if (page < 1) {
         throw new BadRequestException(
            "QUERY PARAM: page must be greater than 0"
         );
      }

      const offset = (page - 1) * limit;

      return { limit, offset };
   }
}
