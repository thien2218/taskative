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

const PipelineStatusSchema = object({
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
});

const PipelineSchema = pipe(
   array(PipelineStatusSchema),
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
   completedStatus: optional(PipelineStatusSchema),
   pipeline: optional(PipelineSchema)
});

export const UpdateBoardSchema = pipe(
   partial(CreateBoardSchema),
   check(
      (v) => Object.keys(v).length > 0,
      "At least one field must be provided"
   )
);
