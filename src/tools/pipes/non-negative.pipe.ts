import { PipeTransform } from "@nestjs/common";

export class ParseNonNegativePipe implements PipeTransform {
   transform(value: string): Promise<number> {
      return new Promise((resolve, reject) => {
         const intValue = parseInt(value);

         if (isNaN(intValue)) {
            reject("Not a number");
         } else if (intValue < 0) {
            reject("Number must be non-negative");
         }

         resolve(intValue);
      });
   }
}
