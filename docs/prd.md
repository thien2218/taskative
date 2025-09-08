# Taskative Product Requirements Document

> Current focus: backend-first (APIs, data model, infrastructure). UI design is deferred to post-MVP.

## Goals and Background Context

### Goals

\- Provide an intuitive task management interface for daily tasks and long-term projects.  
\- Support grouping and categorizing tasks into projects or lists.  
\- Allow tasks to have configurable settings: deadlines, recurrence, reminders, priority, and effort.  
\- Enable attaching files to tasks.  
\- Send timely notifications or reminders for upcoming due dates.  
\- Support nested subtasks for breaking down complex tasks.  
\- Offer powerful task filtering, searching and sorting.  
\- Include secure user account management (email/password signup, JWT authentication, password reset).  
\- Enable user profiles with editable first name, last name, username, and avatar.  
\- Track and visualize productivity over time (progress charts, completion metrics).  
\- Ensure high performance and scalability using the specified serverless technology stack.

**Background Context:** Modern task-management tools emphasize features like due dates, recurring schedules, reminders, and attachments to help users stay organized. For example, Zenkit To Do highlights due dates/reminders and repeating tasks as core features[\[1\]](https://zenkit.com/en/todo/features/#:~:text=Due%20Dates%20and%20Reminders), and also supports file attachments, subtasks, and global search to keep tasks organized[\[2\]](https://zenkit.com/en/todo/features/#:~:text=Files)[\[3\]](https://zenkit.com/en/todo/features/#:~:text=Image%3A%20Search). Taskative aims to build on these patterns by incorporating similar capabilities (grouping, scheduling, filtering, etc.) in a unified, user-friendly way. Because Taskative targets both individual daily todos and larger project goals, it will also include metrics to track completion progress over days/weeks/months.

The system’s backend will use a modern serverless architecture. We will use **Hono** (a fast, lightweight web framework) for the API[\[4\]](https://hono.dev/#:~:text=Ultrafast%20%26%20Lightweight) and **Kysely** (a type-safe SQL query builder for TypeScript) for database access[\[5\]](https://kysely.dev/#:~:text=Kysely)[\[6\]](https://kysely.dev/#:~:text=Kysely%27s%20community,right%20out%20of%20the%20box). Cloudflare D1 will serve as the primary relational database (ideal for user profiles, tasks, and other relational data[\[7\]](https://developers.cloudflare.com/workers/platform/storage-options/#:~:text=D1%20is%20Cloudflare%E2%80%99s%20native%20serverless,Worker%20or%20through%20the%20API)), Workers KV will provide an eventually-consistent key-value cache for session or hot data[\[8\]](https://developers.cloudflare.com/workers/platform/storage-options/#:~:text=Workers%20KV), and Cloudflare R2 will store user-uploaded files or large blobs[\[9\]](https://developers.cloudflare.com/workers/platform/storage-options/#:~:text=R2). This stack (Hono on Cloudflare Workers with D1/KV/R2) enables global, low-latency performance and simplifies deployment, as documented by Cloudflare’s serverless platform overview[\[7\]](https://developers.cloudflare.com/workers/platform/storage-options/#:~:text=D1%20is%20Cloudflare%E2%80%99s%20native%20serverless,Worker%20or%20through%20the%20API)[\[8\]](https://developers.cloudflare.com/workers/platform/storage-options/#:~:text=Workers%20KV). We will leverage JWT for stateless auth (as in typical task apps[\[10\]](https://github.com/manthanank/task-management-app#:~:text=This%20is%20a%20full,responsive%20design%20using%20Tailwind%20CSS)) and secure password reset via email tokens.

### Change Log

| Date       | Version | Description                                                                                  | Author  |
| :--------- | :------ | :------------------------------------------------------------------------------------------- | :------ |
| 2025-08-09 | 0.1     | Initial PRD draft based on project brief and research                                        | ChatGPT |
| 2025-09-06 | 0.2     | Added frontmatter meta and refined requirements structure                                    | ChatGPT |
| 2025-09-06 | 0.3     | Aligned to template; added Technical Assumptions, Epic List, Next Steps (backend-only scope) | ChatGPT |

## Requirements

### Functional

1. **FR1:** **User Authentication:** Users can register with email and password, log in, and receive a JWT for authenticated sessions. The system must support secure password hashing, “forgot password” email links, and password reset functionality[\[10\]](https://github.com/manthanank/task-management-app#:~:text=This%20is%20a%20full,responsive%20design%20using%20Tailwind%20CSS).

2. **FR2:** **Task CRUD:** Users can create, view, update, and delete tasks. Each task has a summary and an optional note. Tasks can have 3 statuses: _todo_, _in progress_, and _done_.

3. **FR3:** **Task Grouping:** Users can organize tasks into groups, projects, or lists. A task can belong to one or more user-defined groups or projects for better organization.

4. **FR4:** **Task Settings:** Each task supports a _deadline_ and a _priority_ flag. Users can specify if the task _repeats_ (daily/weekly/monthly/etc.) and set a _reminder_ time relative to the deadline. The UI should allow setting an “effort estimate” (e.g., hours or points) per task to help planning. (These mirror Zenkit’s due-dates/reminders and repeaters[\[1\]](https://zenkit.com/en/todo/features/#:~:text=Due%20Dates%20and%20Reminders).)

5. **FR5:** **Subtasks:** Users can break a task into multiple nested subtasks or checklists. Subtasks inherit the parent task’s context and can each be marked complete independently (similar to Zenkit’s subtasks feature[\[11\]](https://zenkit.com/en/todo/features/#:~:text=Image%3A%20Subtasks%20and%20Checklists)).

6. **FR6:** **Filtering & Searching:** Users can filter task lists by attributes (e.g. group, priority, due date range, completion status) and perform full-text search across task titles and notes. The interface should include a global search input for quickly finding tasks (Zenkit’s global search for tasks is a model here[\[3\]](https://zenkit.com/en/todo/features/#:~:text=Image%3A%20Search)).

7. **FR7:** **Notifications:** Based on a task’s reminder setting, the system will send notifications (e.g. push or email) to the user. For example, a reminder could be sent X minutes/hours before a due date. This helps users stay on top of upcoming tasks (as Zenkit pushes updates for task deadlines[\[12\]](https://zenkit.com/en/todo/features/#:~:text=Image%3A%20Push%20Notifications)).

8. **FR8:** **User Profiles:** Users can view and update their profile information: first name, last name, username, and profile image/avatar. The API should support reading, updating, and (optionally) deleting profile data.

9. **FR9 (Post-MVP):** **Progress Tracker:** Provide dashboards/charts showing completed tasks over various timeframes (daily, weekly, monthly, yearly, all time). Users should see how many tasks they completed each day/week and trends in their activity.

10.   **FR10 (Post-MVP):** **Productivity Metrics:** Calculate and display metrics such as on-time completion rate, average lead time (time before deadline tasks are done), and distribution of completed tasks by priority. For example, if many tasks are completed past their deadline, show a warning.

11.   **FR11 (Post-MVP):** **File Attachments:** Allow users to upload and attach files (documents, images) to tasks via Cloudflare R2 storage. This extends “link attachment” to full file uploads, so all relevant task resources are in one place.

### Non-Functional

1. **NFR1 (Tech Stack):** The backend must use **Hono.js** on Cloudflare Workers and **Kysely** for database access, as specified. (Hono is an ultra-fast, lightweight framework suitable for Workers[\[4\]](https://hono.dev/#:~:text=Ultrafast%20%26%20Lightweight). Kysely provides type-safe SQL for SQLite/D1[\[5\]](https://kysely.dev/#:~:text=Kysely)[\[6\]](https://kysely.dev/#:~:text=Kysely%27s%20community,right%20out%20of%20the%20box).)

2. **NFR2 (Performance & Scalability):** The service must handle many concurrent users globally with low latency. Cloudflare’s serverless platform provides automatic horizontal scaling. Use Workers KV for high-read data (cache), which is optimized for low-latency reads globally[\[8\]](https://developers.cloudflare.com/workers/platform/storage-options/#:~:text=Workers%20KV). The API should respond quickly (e.g. \<200ms for common requests).

3. **NFR3 (Security):** All user data in transit must use HTTPS, and sensitive data (passwords) stored hashed. JWTs should be signed securely. User-uploaded files in R2 should be access-controlled (private buckets). Follow best practices (e.g. OWASP guidelines) to protect against common web vulnerabilities. Two-factor authentication may be considered (as Zenkit offers 2FA) but not required for MVP.

4. **NFR4 (Reliability & Availability):** Aim for high availability by leveraging Cloudflare’s edge network. Data in D1 (SQLite) and R2 is automatically replicated; KV is eventually consistent but cached globally. Backups: D1 supports multiple databases if \>10GB, and R2 files are redundantly stored. Plan for error handling and retries in the Workers code.

5. **NFR5 (Data Consistency):** Use D1 for critical relational data (user profiles, tasks) to ensure transactional safety. Workers KV is eventual-consistent, which is acceptable for caching but not for primary user data.

6. **NFR6 (Maintainability):** The codebase should follow clear architecture (e.g. MVC or clean layers). Using Kysely ensures SQL queries are checked at compile time[\[5\]](https://kysely.dev/#:~:text=Kysely). Employ migrations/seed for D1 schema changes.

7. **NFR7 (Cost Efficiency):** Prefer free-tier resources where feasible. Cloudflare Workers and KV have free tiers; D1 is currently free up to storage limits. Design queries and data usage to stay within free tier limits if possible (similar to aiming for AWS free-tier in other designs, although not directly quoted here).

8. **NFR8 (Usability):** The UI should load quickly and work offline if desired. (Offline support is a common feature in advanced to-do apps[\[13\]](https://zenkit.com/en/todo/features/#:~:text=Image%3A%20Offline%20Access), but optional post-MVP.) The app must be responsive to all screen sizes[\[14\]](https://medium.com/@ckn.deesit/designing-a-to-do-list-application-ffcbe80f2fdf#:~:text=1,tasks%20within%20a%20predefined%20time) (mobile-friendly up to large desktop).

9. **NFR9 (Privacy/Compliance):** Handle user data responsibly. If targeting EU users, comply with GDPR (clear privacy policy, data deletion on request). Ensure encrypted storage of sensitive fields.

10.   **NFR10 (Compatibility):** Support modern web browsers (desktop and mobile). No need to support very old browsers beyond what Workers supports. Profile images should be stored in R2 and served via Workers with appropriate MIME types.

## User Interface Design Goals (Deferred: Post-MVP)

This project is backend-first; frontend/UI is deferred and not part of the current development plan.

### Overall UX Vision

-  Deliver a fast, minimal UI optimized for quick task entry, review, and updates. Keep interactions simple and predictable; prioritize accessibility and performance. (Deferred)

### Key Interaction Paradigms

-  Inline task editing, keyboard-first navigation, lightweight filters/search, and minimal dialogs. (Deferred)

### Core Screens and Views

-  Login, Task List, Task Detail, Groups/Projects, Settings/Profile. (Deferred)

### Accessibility: None

-  Accessibility target to be defined when frontend starts; aim for WCAG AA post-MVP. (Deferred)

### Branding

-  No branding constraints defined yet. Establish palette/typography with frontend kickoff. (Deferred)

### Target Device and Platforms: Web Responsive

-  Web responsive as the primary target; native platforms out of scope for MVP. (Deferred)

## Technical Assumptions

### Repository Structure: Monorepo

-  Single repository containing `backend` and `docs`.

### Service Architecture

-  Serverless on Cloudflare Workers using Hono for HTTP APIs.
-  Cloudflare D1 as primary relational store; Kysely for type-safe queries; Prisma for schema/migrations with prisma-kysely for type generation.
-  Workers KV for short-lived, eventually consistent caching (lists/details; ~30s TTL). R2 reserved for future file attachments (post-MVP).
-  Rate limiting via platform-provided ratelimit binding (`AUTH_RATE_LIMITER`).

### Testing Requirements

-  Unit + light integration tests with Vitest for handlers, services, and middleware.
-  Local dev via Wrangler; CI to run tests and typechecks (to be configured).

### Additional Technical Assumptions and Requests

-  Cookie-based session JWT (signed) with ~20-minute rolling renewal via middleware.
-  CSRF, CORS, and basic caching enabled via Hono middleware.
-  Strict TypeScript settings; Cloudflare Workers types.
-  Migrations and seed scripts required for D1; seed idempotent.

## Epic List

-  **Epic 0: Database Schema, Migrations, Seeding, and README** — Establish Prisma schema, migrations, Kysely types, and idempotent seed; document project basics.
-  **Epic 1: User Authentication** — Email/password auth with session-backed JWT cookie, reset flows, and rate limiting.
-  **Epic 2: Task CRUD** — CRUD endpoints for tasks with ownership, validation, and KV-backed read caching.
-  **Epic 3: Task Grouping** — Groups CRUD; associate a task to a single group; safe deletion semantics.
-  **Epic 4: Task Settings** — Persist deadline, repeat interval, reminder time, priority, effort; manage reminder rows.
-  **Epic 5: Subtasks** — CRUD for subtasks under a parent task; ownership enforced.
-  **Epic 6: Filtering & Searching** — Filter list endpoint and basic substring search with supporting indexes and caching.
-  **Epic 7: Notifications** — Cron worker to deliver due reminders; update reminder state; retries minimal.
-  **Epic 8: User Profiles** — Read/update/delete user profile fields for the authenticated user.

## Epic 0 — Database Schema, Migrations, Seeding, and README

-  Goal: Establish Prisma schema/migrations, generate Kysely types, and seed demo data.
-  Details: See `docs/epics/0-app-init.md`.

## Epic 1 — User Authentication

-  Goal: Email/password auth with session-backed JWT cookie and reset flow.
-  Details: See `docs/epics/1-authentication.md`.

## Epic 2 — Task CRUD

-  Goal: CRUD for tasks with validation, ownership, and KV caching.
-  Details: See `docs/epics/2-task-crud.md`.

## Epic 3 — Task Grouping

-  Goal: Group tasks under user-defined groups; safe deletion behavior.
-  Details: See `docs/epics/3-task-grouping.md`.

## Epic 4 — Task Settings

-  Goal: Persist scheduling/priority/effort fields and related reminder rows.
-  Details: See `docs/epics/4-task-settings.md`.

## Epic 5 — Subtasks

-  Goal: CRUD for subtasks under a task; enforce ownership and cascade deletes.
-  Details: See `docs/epics/5-subtasks.md`.

## Epic 6 — Filtering & Searching

-  Goal: Filtering and substring search with indexes and cached listings.
-  Details: See `docs/epics/6-filtering-and-search.md`.

## Epic 7 — Notifications

-  Goal: Cron worker to deliver reminders and manage state transitions.
-  Details: See `docs/epics/7-notifications.md`.

## Epic 8 — User Profiles

-  Goal: User can read/update/delete their profile.
-  Details: See `docs/epics/8-user-profiles.md`.

## Checklist Results Report

-  Pending. To be populated after running the product management checklist against this PRD.

## Next Steps

### UX Expert Prompt

-  UI is deferred. When frontend begins, use this PRD to draft UX goals, flows, and wireframes aligned to the epics and constraints.

### Architect Prompt

-  Using this PRD, finalize the service architecture on Cloudflare Workers with Hono, D1, and KV; define module boundaries, request validation, error handling, and deployment workflows; confirm migration strategy and caching semantics; plan test coverage (unit + integration) and CI.

**Sources:** Core features and UI patterns are informed by examples like Zenkit To Do[\[15\]](https://zenkit.com/en/todo/features/#:~:text=Due%20Dates%20and%20Reminders)[\[11\]](https://zenkit.com/en/todo/features/#:~:text=Image%3A%20Subtasks%20and%20Checklists). Technical stack choices (Hono, D1, KV, R2) are based on Cloudflare documentation[\[7\]](https://developers.cloudflare.com/workers/platform/storage-options/#:~:text=D1%20is%20Cloudflare%E2%80%99s%20native%20serverless,Worker%20or%20through%20the%20API)[\[8\]](https://developers.cloudflare.com/workers/platform/storage-options/#:~:text=Workers%20KV)[\[9\]](https://developers.cloudflare.com/workers/platform/storage-options/#:~:text=R2) and technology sites[\[4\]](https://hono.dev/#:~:text=Ultrafast%20%26%20Lightweight)[\[5\]](https://kysely.dev/#:~:text=Kysely). The GitHub example app[\[10\]](https://github.com/manthanank/task-management-app#:~:text=This%20is%20a%20full,responsive%20design%20using%20Tailwind%20CSS) illustrates typical auth and task CRUD requirements. These sources guided the requirements above.

---

[\[1\]](https://zenkit.com/en/todo/features/#:~:text=Due%20Dates%20and%20Reminders) [\[2\]](https://zenkit.com/en/todo/features/#:~:text=Files) [\[3\]](https://zenkit.com/en/todo/features/#:~:text=Image%3A%20Search) [\[11\]](https://zenkit.com/en/todo/features/#:~:text=Image%3A%20Subtasks%20and%20Checklists) [\[12\]](https://zenkit.com/en/todo/features/#:~:text=Image%3A%20Push%20Notifications) [\[13\]](https://zenkit.com/en/todo/features/#:~:text=Image%3A%20Offline%20Access) [\[15\]](https://zenkit.com/en/todo/features/#:~:text=Due%20Dates%20and%20Reminders) Features | Zenkit To Do

[https://zenkit.com/en/todo/features/](https://zenkit.com/en/todo/features/)

[\[4\]](https://hono.dev/#:~:text=Ultrafast%20%26%20Lightweight) Hono \- Web framework built on Web Standards

[https://hono.dev/](https://hono.dev/)

[\[5\]](https://kysely.dev/#:~:text=Kysely) [\[6\]](https://kysely.dev/#:~:text=Kysely%27s%20community,right%20out%20of%20the%20box) Kysely

[https://kysely.dev/](https://kysely.dev/)

[\[7\]](https://developers.cloudflare.com/workers/platform/storage-options/#:~:text=D1%20is%20Cloudflare%E2%80%99s%20native%20serverless,Worker%20or%20through%20the%20API) [\[8\]](https://developers.cloudflare.com/workers/platform/storage-options/#:~:text=Workers%20KV) [\[9\]](https://developers.cloudflare.com/workers/platform/storage-options/#:~:text=R2) Choosing a data or storage product. · Cloudflare Workers docs

[https://developers.cloudflare.com/workers/platform/storage-options/](https://developers.cloudflare.com/workers/platform/storage-options/)

[\[10\]](https://github.com/manthanank/task-management-app#:~:text=This%20is%20a%20full,responsive%20design%20using%20Tailwind%20CSS) GitHub \- manthanank/task-management-app: Full Stack Task Management App

[https://github.com/manthanank/task-management-app](https://github.com/manthanank/task-management-app)

[\[14\]](https://medium.com/@ckn.deesit/designing-a-to-do-list-application-ffcbe80f2fdf#:~:text=1,tasks%20within%20a%20predefined%20time) Designing a To-Do List Application | by Chakrin Deesit | Medium

[https://medium.com/@ckn.deesit/designing-a-to-do-list-application-ffcbe80f2fdf](https://medium.com/@ckn.deesit/designing-a-to-do-list-application-ffcbe80f2fdf)
