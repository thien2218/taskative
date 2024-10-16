import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "database/database.service";
import { listsTable, tasksTable, usersTable } from "database/tables";
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { CreateListDto, Page, UpdateListDto } from "utils/types";

@Injectable()
export class ListService {
   constructor(private readonly dbService: DatabaseService) {}

   async findMany(boardId: string, userId: string, page: Page) {
      const query = this.dbService.prepared.findListsQuery;

      const lists = await query
         .all({ boardId, userId, ...page })
         .catch(this.dbService.handleDbError);

      if (!lists || !lists.length) {
         throw new NotFoundException("No lists found");
      }

      return lists;
   }

   async findOne(id: string, boardId: string, userId: string) {
      const query = this.dbService.prepared.findListQuery;

      const list = await query
         .get({ id, boardId, userId })
         .catch(this.dbService.handleDbError);

      if (!list) {
         throw new NotFoundException("List not found");
      }

      return list;
   }

   async findTasksFromList(
      id: string,
      boardId: string,
      userId: string,
      page: Page
   ) {
      const query = this.dbService.prepared.findTasksFromListQuery;

      const tasks = await query
         .all({ id, boardId, userId, ...page })
         .catch(this.dbService.handleDbError);

      if (!tasks || !tasks.length) {
         throw new NotFoundException("No tasks found");
      }

      return tasks;
   }

   async create(boardId: string, userId: string, createListDto: CreateListDto) {
      const id = nanoid(25);

      const query = this.dbService.builder
         .insert(listsTable)
         .values({ id, userId, boardId, ...createListDto });

      await query.run().catch(this.dbService.handleDbError);

      return { message: "List created successfully", id };
   }

   async update(
      id: string,
      boardId: string,
      userId: string,
      updateListDto: UpdateListDto
   ) {
      const query = this.dbService.builder
         .update(listsTable)
         .set(updateListDto)
         .where(
            and(
               eq(listsTable.id, id),
               eq(listsTable.boardId, boardId),
               eq(usersTable.id, userId)
            )
         );

      await query
         .run()
         .catch(this.dbService.handleDbError)
         .then((resultSet) => {
            if (!resultSet || !resultSet.rowsAffected) {
               throw new NotFoundException("List not found");
            }
         });
   }

   async addTasks(
      id: string,
      boardId: string,
      userId: string,
      tasksToAdd: string[]
   ) {
      const query = this.dbService.builder
         .update(tasksTable)
         .set({ listId: id })
         .where(
            and(
               eq(tasksTable.listId, id),
               eq(tasksTable.boardId, boardId),
               eq(tasksTable.userId, userId),
               inArray(tasksTable.id, tasksToAdd)
            )
         )
         .returning({ id: tasksTable.id });

      const addedTasks = await query.all().catch(this.dbService.handleDbError);

      if (!addedTasks || !addedTasks.length) {
         throw new NotFoundException("Tasks not found");
      }

      return addedTasks.map(({ id }) => id);
   }

   async removeTasks(
      id: string,
      boardId: string,
      userId: string,
      tasksToRemove: string[]
   ) {
      const query = this.dbService.prepared.removeTasksFromListQuery;

      const removedTasks = await query
         .all({ id, boardId, userId, tasksToRemove })
         .catch(this.dbService.handleDbError);

      if (!removedTasks || !removedTasks.length) {
         throw new NotFoundException("Tasks not found");
      }

      return removedTasks.map(({ id }) => id);
   }

   async delete(id: string, boardId: string, userId: string) {
      const query = this.dbService.prepared.deleteListQuery;

      await query
         .run({ id, boardId, userId })
         .catch(this.dbService.handleDbError)
         .then((resultSet) => {
            if (!resultSet || !resultSet.rowsAffected) {
               throw new NotFoundException("List not found");
            }
         });
   }
}
