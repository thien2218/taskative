import { PipeTransform } from "@nestjs/common";

export class ParseLimitPipe implements PipeTransform<string> {
   transform(value: string): Promise<number> {
      return new Promise((resolve, reject) => {
         const limit = parseInt(value);

         if (isNaN(limit)) {
            reject("Invalid limit query");
         } else if (![10, 20, 30, 40, 50].includes(limit)) {
            reject("Limit must be either 10, 20, 30, 40 or 50");
         }

         resolve(limit);
      });
   }
}
