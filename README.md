# When Light Breaks - API Server

This is the official API server for the **When Light Breaks** web page. It is a fast, lightweight backend built with [Hono](https://hono.dev/), TypeScript, [Drizzle ORM](https://orm.drizzle.team/), and PostgreSQL.

## Tech Stack

*   **Framework:** [Hono](https://hono.dev/) (Node.js Adapter)
*   **Language:** TypeScript
*   **Database:** PostgreSQL
*   **ORM:** Drizzle ORM
*   **Validation:** Zod
*   **Containerization:** Docker

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [npm](https://www.npmjs.com/)
*   [Docker](https://www.docker.com/) and Docker Compose (Required for running the database locally)

## Getting Started

Follow these steps to set up the project locally:

**1. Clone the repository**
```bash
git clone <your-repo-url>
cd whenlightbreaks-api
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure Environment Variables**
Create a `.env` file in the root directory of the project and populate it with the necessary variables. You can use the following template:

```ini
# Server
PORT=3000

# DB
DB_HOST=localhost
DB_NAME=database
DB_USER=user
DB_PASSWORD=password
DB_PORT=5432

# JWT
JWT_SECRET=your_super_secret_jwt_string
```

**4. Start the Database (Docker)**
Make sure Docker is running on your machine, then spin up the required containers (PostgreSQL):
```bash
npm run docker
```

**5. Setup the Database**
Run Drizzle to generate and apply migrations to your newly created database:
```bash
npm run db:generate
npm run db:migrate

# Or you can use the shorthand
npm run db:setup
```

**6. Start the Development Server**
Launch the API server with hot-reloading:
```bash
npm run dev
```

Your server should now be running at `http://localhost:3000`.

## Available Scripts

Here is a list of commands you can run via `npm run <script>`:

### Server
*   `dev`: Starts the development server using `tsx` in watch mode.
*   `build`: Compiles the TypeScript source code into JavaScript in the `dist/` folder.
*   `start`: Runs the compiled application (`node dist/index.js`). Note: You must run `npm run build` first.
*   `docker`: Starts the required Docker containers via `docker-compose up`.

### Database (Drizzle ORM)
*   `db:setup`: Generates SQL migrations and applies them to the database.
*   `db:generate`: Generates SQL migration files based on your Drizzle schema.
*   `db:migrate`: Applies pending migrations to the database.
*   `db:push`: Pushes schema changes directly to the database (useful for rapid prototyping).
*   `db:studio`: Opens Drizzle Studio, a visual GUI to view and edit your database data.
*   `db:pull`: Introspects the database and generates a Drizzle schema.
*   `db:check`: Checks your schema for discrepancies.
*   `db:up`: Upgrades your schema.