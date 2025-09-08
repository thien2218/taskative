# Taskative - Task Management Application

## Introduction

Taskative is a modern, full-stack task management application built for efficiency and scalability. It provides comprehensive task organization with support for groups, subtasks, reminders, and user management. The application is designed to handle both individual and collaborative task management workflows.

## Purpose

This application serves as a complete task management solution, offering:

-  **User Management**: Secure registration, authentication, and profile management
-  **Task Organization**: Create, organize, and track tasks with priorities, deadlines, and notes
-  **Group Management**: Organize tasks into logical groups and categories
-  **Subtask Support**: Break down complex tasks into manageable subtasks
-  **Smart Reminders**: Set and manage reminders for important tasks
-  **RESTful API**: Comprehensive API for integration and mobile/web clients

## Tech Stack Overview

Taskative leverages modern web technologies optimized for performance and developer experience:

### Backend Infrastructure

-  **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless edge computing platform
-  **Framework**: [Hono](https://hono.dev/) - Lightweight, fast web framework for edge environments
-  **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) - Serverless SQLite-based relational database
-  **Query Builder**: [Kysely](https://kysely.dev/) - Type-safe SQL query builder for TypeScript
-  **Schema Management**: [Prisma](https://www.prisma.io/) - Database schema definition and migration management
-  **Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/) - Object storage for assets (planned)
-  **Cache**: [Cloudflare KV](https://developers.cloudflare.com/kv/) - Key-value store for caching (planned)

### Development & Tooling

-  **Language**: TypeScript for type safety and developer experience
-  **Package Manager**: pnpm for efficient dependency management
-  **Testing**: Vitest for unit testing
-  **Deployment**: Wrangler CLI for Cloudflare Workers deployment

## Project Structure

The project follows a clean, organized structure optimized for maintainability:

```
backend/src/
├── routes/          # API route handlers and endpoint definitions
├── services/        # Business logic and service layer
├── db/             # Database schema, migrations, and utilities
├── validators/      # Request validation schemas and middleware
├── middlewares/     # Custom middleware functions
├── utils/          # Shared utility functions and helpers
├── types.ts        # Global TypeScript type definitions
└── index.ts        # Application entry point and configuration
```

## Quick Links & Documentation

### Core Documentation

-  **[Product Requirements (PRD)](v1/prd.md)** - Complete product specification and requirements
-  **[Project Epics](v1/epics/)** - High-level feature epics and milestones
-  **[Architecture Overview](v1/architecture/)** - Detailed technical architecture and design decisions

### Technical References

-  **[API Endpoints](v1/architecture/section-2-api-endpoints.md)** - Complete REST API specification
-  **[Auth Endpoints (Register/Login)](v1/api/auth-endpoints.md)** - Request/response examples and security notes
-  **[Database Schema](v1/architecture/section-3-database-schema-full-sql.md)** - Database design and relationships
-  **[System Architecture](v1/architecture/section-1-overview-and-high-level-design.md)** - High-level system design

### Development Resources

-  **[Development Stories](v1/stories/)** - Implementation stories and task breakdown
-  **Database Commands**:

   -  `npm run db:migrate:create` - Generate development migrations (create-only)
   -  `npm run db:migrate:apply` - Apply pending migrations to database
   -  `npm run db:seed` - Populate database with demo data

   **Migration Workflow**: Use `db:migrate:create` to generate new migrations after schema changes, then `db:migrate:apply` to apply them. Always run `db:migrate:apply` after pulling schema updates from other developers.

   -  `npm run db:migrate:reset` - Reset local database state (D1) and re-generate Prisma artifacts (useful for a clean slate during development)

-  **Development Commands**:
   -  `npm run dev` - Start development server with hot reload
   -  `npm run test` - Run test suite
   -  `npm run deploy` - Deploy to Cloudflare Workers

## Getting Started

1. **Setup Dependencies**

   ```bash
   cd backend
   npm install
   ```

2. **Database Setup**

   ```bash
   npm run db:migrate:apply     # Apply migrations
   npm run db:seed      # Add demo data (optional)
   ```

3. **Development Server**

   ```bash
   npm run dev          # Start local development
   ```

4. **Testing**
   ```bash
   npm run test         # Run test suite
   ```

## Key Features

-  **🔐 Authentication**: Secure user registration and login with JWT tokens
-  **📋 Task Management**: Full CRUD operations for tasks with rich metadata
-  **👥 Group Organization**: Organize tasks into logical groups and categories
-  **✅ Subtask Support**: Break complex tasks into manageable subtasks
-  **⏰ Smart Reminders**: Flexible reminder system with repeat intervals
-  **🔍 Advanced Filtering**: Filter tasks by status, priority, deadline, and group
-  **📊 Analytics Ready**: Structured data design for future reporting features
-  **🚀 Edge Performance**: Deployed on Cloudflare's global edge network

## Contributing

This project follows a story-driven development approach. Check the [stories directory](v1/stories/) for current development tasks and implementation details.

For technical questions, refer to the architecture documentation. For feature requests, consult the product requirements document.
