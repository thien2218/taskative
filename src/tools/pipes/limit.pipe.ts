import { PipeTransform } from "@nestjs/common";

export class ParseLimitPipe implements PipeTransform<string> {
   transform(value: string): Promise<number> {
      return new Promise((resolve, reject) => {
         const limit = parseInt(value);

         if (isNaN(limit)) {
            reject("Invalid limit query");
         } else if (limit < 10 || limit > 40) {
            reject("Limit must be between 10 and 40 inclusive");
         }

         resolve(limit);
      });
   }
}
