import bcrypt from "bcryptjs";
import { Kysely, SqliteDialect, CamelCasePlugin } from "kysely";
import Database from "better-sqlite3";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import type { DB } from "./types.js";

// Initialize the database connection (read from env with safe fallback)
function resolveDatabasePath(): string {
  const envUrl = process.env.DATABASE_URL?.trim();
  if (envUrl && envUrl.length > 0) {
    // Prisma uses a "file:" URL for sqlite; better-sqlite3 expects a path
    return envUrl.replace(/^file:/, "");
  }
  const d1Dir = "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject";
  if (existsSync(d1Dir)) {
    const candidate = readdirSync(d1Dir).find((f) => f.endsWith(".sqlite"));
    if (candidate) return join(d1Dir, candidate);
  }
  // Fallback to empty string if no database path is found to throw an error and signal that the path is invalid
  return "";
}

const dbPath = resolveDatabasePath();
console.log(`🔗 Connecting to database: ${dbPath}`);

const db = new Kysely<DB>({
  dialect: new SqliteDialect({
    database: new Database(dbPath),
  }),
  plugins: [new CamelCasePlugin()],
});

// Helper function to create deterministic password hashes for demo data
function createDemoPasswordHash(password: string): string {
  // Use bcrypt for demo to mirror production hashing
  const SALT_ROUNDS = 10;
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

// Demo data definitions
const DEMO_USER_EMAIL = "demo@taskative.com";
const DEMO_USER_ID = "demo-user-123";
const DEMO_GROUP_ID = "demo-group-456";

export async function seedDemoData() {
  console.log("🌱 Starting idempotent seed process...");

  try {
    // Debug: Check what tables exist in the database
    const tables = await db.introspection.getTables();
    console.log(
      "📋 Available tables:",
      tables.map((t) => t.name),
    );

    if (tables.length === 0) {
      console.log("❌ No tables found in database. Run migrations first!");
      return;
    }

    // 1. Insert demo user (idempotent via ON CONFLICT DO NOTHING)
    await db
      .insertInto("users")
      .values({
        id: DEMO_USER_ID,
        email: DEMO_USER_EMAIL,
        username: "demouser",
        passwordHash: createDemoPasswordHash("demo123"),
        firstName: "Demo",
        lastName: "User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .onConflict((oc) => oc.column("email").doNothing())
      .execute();
    console.log("✓ Ensured demo user exists");

    // 2. Insert demo group (idempotent)
    await db
      .insertInto("groups")
      .values({
        id: DEMO_GROUP_ID,
        userId: DEMO_USER_ID,
        name: "Personal Projects",
        color: "#3B82F6",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .onConflict((oc) => oc.column("id").doNothing())
      .execute();
    console.log("✓ Ensured demo group exists");

    // 3. Insert demo tasks (idempotent)
    const demoTasks = [
      {
        id: "task-1",
        title: "Setup project documentation",
        note: "Create comprehensive documentation for the new project",
        priority: 1,
        effort: 3,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        status: "in-progress",
        groupId: DEMO_GROUP_ID,
      },
      {
        id: "task-2",
        title: "Implement user authentication",
        note: "Add login, register, and session management",
        priority: 1,
        effort: 5,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        status: "pending",
        groupId: DEMO_GROUP_ID,
      },
      {
        id: "task-3",
        title: "Design API endpoints",
        note: "Define REST API structure and documentation",
        priority: 2,
        effort: 2,
        status: "completed",
        groupId: null, // No group assignment
      },
    ];

    for (const taskData of demoTasks) {
      await db
        .insertInto("tasks")
        .values({
          ...taskData,
          userId: DEMO_USER_ID,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .onConflict((oc) => oc.column("id").doNothing())
        .execute();
      console.log(`✓ Ensured task "${taskData.title}" exists`);
    }

    // 4. Insert demo subtasks (idempotent)
    const demoSubtasks = [
      {
        id: "subtask-1",
        taskId: "task-1",
        title: "Write README.md",
        status: "completed",
      },
      {
        id: "subtask-2",
        taskId: "task-1",
        title: "Create API documentation",
        status: "in-progress",
      },
      {
        id: "subtask-3",
        taskId: "task-1",
        title: "Add deployment guide",
        status: "pending",
      },
      {
        id: "subtask-4",
        taskId: "task-2",
        title: "Setup JWT authentication",
        status: "pending",
      },
      {
        id: "subtask-5",
        taskId: "task-2",
        title: "Create registration endpoint",
        status: "pending",
      },
    ];

    for (const subtaskData of demoSubtasks) {
      await db
        .insertInto("subtasks")
        .values({
          ...subtaskData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .onConflict((oc) => oc.column("id").doNothing())
        .execute();
      console.log(`✓ Ensured subtask "${subtaskData.title}" exists`);
    }

    // 5. Insert demo reminder (idempotent)
    const demoReminder = {
      id: "reminder-1",
      taskId: "task-1",
      userId: DEMO_USER_ID,
      remindAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      status: "scheduled",
    };

    await db
      .insertInto("reminders")
      .values({
        ...demoReminder,
        createdAt: new Date().toISOString(),
      })
      .onConflict((oc) => oc.column("id").doNothing())
      .execute();
    console.log("✓ Ensured demo reminder exists");

    console.log("🎉 Seed process completed successfully!");

    // Display summary
    const userCount = await db
      .selectFrom("users")
      .select((db) => db.fn.count("id").as("count"))
      .executeTakeFirst();
    const taskCount = await db
      .selectFrom("tasks")
      .select((db) => db.fn.count("id").as("count"))
      .executeTakeFirst();
    const subtaskCount = await db
      .selectFrom("subtasks")
      .select((db) => db.fn.count("id").as("count"))
      .executeTakeFirst();

    console.log("\n📊 Database Summary:");
    console.log(`   Users: ${userCount?.count || 0}`);
    console.log(`   Tasks: ${taskCount?.count || 0}`);
    console.log(`   Subtasks: ${subtaskCount?.count || 0}`);
  } catch (error) {
    console.error("❌ Seed process failed:", error);
    throw error;
  } finally {
    // Close database connection
    await db.destroy();
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoData().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}
