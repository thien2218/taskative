import {
   array,
   check,
   length,
   maxLength,
   minLength,
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
                  number(),
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

export const CreateBoardSchema = object({
   name: pipe(
      string(),
      minLength(3, "Board name must be at least 3 characters"),
      maxLength(100, "Board name cannot exceed 100 characters")
   ),
   description: optional(
      pipe(
         string(),
         nonEmpty("Description cannot be empty"),
         maxLength(1000, "Description cannot exceed 1000 characters")
      )
   ),
   pipeline: optional(PipelineSchema)
});

export const UpdateBoardSchema = pipe(
   partial(CreateBoardSchema),
   check(
      ({ name, description }) => !!name || !!description,
      "At least one field must be provided"
   )
);
