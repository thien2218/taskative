import {
   array,
   check,
   forward,
   integer,
   length,
   maxLength,
   minLength,
   minValue,
   nonEmpty,
   number,
   object,
   optional,
   partial,
   pipe,
   string
} from "valibot";
import { StatusSchema } from "./task.schema";

const PipelineSchema = pipe(
   array(
      object({
         name: StatusSchema,
         rgb: pipe(
            array(
               pipe(
                  number("RGB value must be a number"),
                  check(
                     (value) => value >= 0 && value <= 255,
                     "RGB value must be between 0 and 255"
                  )
               )
            ),
            length(3, "RGB value must have 3 elements")
         )
      })
   ),
   nonEmpty("Pipeline cannot be empty")
);

const BoardSchema = object({
   name: pipe(
      string(),
      minLength(3, "Board name must be at least 3 characters"),
      maxLength(100, "Board name cannot exceed 100 characters")
   ),
   description: optional(
      pipe(
         string(),
         nonEmpty("Description cannot be empty"),
         maxLength(500, "Description cannot exceed 500 characters")
      )
   ),
   completedIndex: optional(
      pipe(
         number("Index must be a number"),
         integer("Index must be an integer"),
         minValue(0, "Index must be greater than or equal to 0")
      )
   ),
   pipeline: optional(PipelineSchema)
});

export const CreateBoardSchema = pipe(
   BoardSchema,
   forward(
      check(({ pipeline, completedIndex }) => {
         return (
            (pipeline && completedIndex && completedIndex < pipeline.length) ||
            (!pipeline && !completedIndex)
         );
      }, "Completed index must be within the pipeline length"),
      ["completedIndex"]
   )
);

export const UpdateBoardSchema = pipe(
   partial(BoardSchema),
   check(
      (v) => Object.keys(v).length > 0,
      "At least one field must be provided"
   )
);
