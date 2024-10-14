import { maxLength, nonEmpty, object, pipe, string } from "valibot";

export const NoteContentSchema = object({
   content: pipe(
      string(),
      nonEmpty("Note content is required"),
      maxLength(32 * 1024, "Note content cannot be too long")
   )
});
