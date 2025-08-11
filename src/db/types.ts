import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Group = {
    id: string;
    userId: string;
    name: string;
    color: string | null;
    createdAt: Generated<string>;
    updatedAt: string;
};
export type Reminder = {
    id: string;
    taskId: string;
    userId: string;
    remindAt: string;
    repeatInterval: string | null;
    lastSentAt: string | null;
    status: Generated<string>;
    createdAt: Generated<string>;
};
export type Subtask = {
    id: string;
    taskId: string;
    title: string;
    status: Generated<string>;
    createdAt: Generated<string>;
    updatedAt: string;
};
export type Task = {
    id: string;
    userId: string;
    groupId: string | null;
    title: string;
    note: string | null;
    priority: number | null;
    effort: number | null;
    deadline: string | null;
    repeatInterval: string | null;
    remindAt: string | null;
    status: Generated<string>;
    createdAt: Generated<string>;
    updatedAt: string;
};
export type User = {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    profileImageUrl: string | null;
    tokenVersion: Generated<number>;
    createdAt: Generated<string>;
    updatedAt: string;
};
export type DB = {
    groups: Group;
    reminders: Reminder;
    subtasks: Subtask;
    tasks: Task;
    users: User;
};
