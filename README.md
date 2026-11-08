# Employee Management REST API

A backend REST API which is build using Node.js, Express and PostgreSQL. It helps managing Employees, Departments, Projects, Project Assignments and Work logs.
This project also demonstrates relational database design, SQL Joins, aggregation queries, database constraints and REST API development.
It also implements a high security authentication and authorization system using JWT and Refresh Token rotation.

# Key Improvements(Latest Update)

1. Secure Authentication - JWT Based access tokens with Refresh Tokens stored in httpOnly Cookies
2. Refresh Token Rotation - Automatic reuse detection and session revokation for enhanced security
3. RBAC(Role Based Access Control) - Permission for employee and admin roles
4. Password Security - Industry - standard hashing using bcrypt

# Tech Stack

1. Node.js
2. Express.js
3. PostgreSQL
4. pg(node-postgres)
5. dotenv
6. Thunder Client (API Testing)
7. Libraries - 
a. jsonwebtoken (Access Token)
b. bcrypt (Password Hashing)
c. cookie-parser (Secure cookie management)
d. crypto (Refresh token generation)

# Features

1. Employee Management
2. Department Management
3. Project Management
4. Project Assignment System
5. Work log tracking
6. Analytics dashboard
7. Relational database design
8. Complex SQL Queries
9. Database constraints
10. Error Handling

# Security Features

1. JWT Authentication - Short lives(15m) access token for stateless requests
2. Refresh Token Rotation - Long lives(7d) token that refresh both tokens upon use, preventing replay attacks
3. Secure Cookies - Refresh tokens are sent via httpOnly cookies making them inaccesible for client-side Javascript(XSS Protection)
4. Role Authorization - Reusable middlewares to restrict routes(eg. only admins can delete employees)
5. Database integrity - On-delete cascade, foreign keys and unique constraints


# Project Structure

src/
  |
  | - config/
         |-----db.js
  | - middlewares
          |-----authMiddleware.js
          |-----authorize.js
  | 
  | - routes/
         | ------employee-reads.js
         | ------analytics.js
         | ------admin-writes.js
         | ------auth.js
  |
  | - app.js

# Database Template

Employees
Departments
Projects
Project Assignments
Work Logs
Users
refresh_tokens

# API Endpoints

## Employee Reads

1. GET /employees
2. GET /departments/:id/employees
3. GET /employees/:id/projects
4. GET /projects/:id/employees
5. GET /employees/details

## Analytics

1. GET /stats/overview
2. GET /stats/salaries
3. GET /stats/departments/employees
4. GET /stats/departments/salaries
5. GET /stats/departments/large
6. GET /stats/projects/budget
7. GET /stats/projects/employee_count
8. GET /stats/projects/allocated_hours
9. GET /stats/projects/overloaded
10. GET /stats/employees/project_workload
11. GET /stats/employees/multi-projects
12. GET /stats/work_logs/status
13. GET /stats/employees/work_logs
14. GET /stats/employees/active
15. GET /stats/dashboard

## Admin writes

1. POST /employees
2. DELETE /departments/:id
3. DELETE /employees/:id
4. PUT /departments/:id
5. POST /project_assignment
6. GET /schema/health

## Auth.js

1. POST /auth/register
2. POST /auth/login
3. GET /auth/me
4. POST /auth/refresh
5. POST /auth/logout

# SQL Concepts Demonstrated

1. INNER JOIN, LEFT JOIN
2. GROUP BY
3. HAVING 
4. Aggregate Functions
5. Parameterised Queries
6. Nested JSON Response
7. Many-to-Many Relationships
8. One-to-Many Relationships

# PostgreSQL Constraints

1. PRIMARY KEY
2. FOREIGN KEY
3. UNIQUE
4. CHECK
5. DEFAULT
6. ON DELETE CASCADE

# Error Handling

This API handles common PostgreSQL errors including:

1. 23505(Unique constraint violation)
2. 23503(Foreign Key Violation)
3. 23502(Not Null Violation)
4. 23514(Check constraint Violation)

## Input Validation (JSON Schema)

Every request is checked against a JSON Schema (using [Ajv](https://ajv.js.org/)) **before** the route handler runs. A bad request gets a `400` answer in one consistent format and never reaches the database. 14 routes are covered: all routes that read a body, an `:id` in the path, or a query value.

### How it works

- `src/middlewares/validate.js` builds a middleware from schemas for `body`, `params` and `query`.
- `src/schemas/` holds the schemas: `common.js` (shared ids and numbers), `auth.js`, `admin.js` and `analytics.js`.
- Routes only list the schemas they need:

```js
router.put("/departments/:id",
    validate({ params: idParams, body: updateDepartmentBody }),
    async (req, res) => { /* handler */ });
```

### Error format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "body.salary", "message": "must be > 0" }
  ]
}
```

### Where the rules come from

The limits are taken from the database schema (`schema.sql`), so the API rejects what the database would reject, but earlier and with a clear message.

| Field | Rule | Source |
|---|---|---|
| `first_name`, `last_name` | string, 1 to 30 characters | `VARCHAR(30) NOT NULL` |
| `email` | valid email, up to 100 characters | `VARCHAR(100)` |
| `salary` | number above 0, at most 99999999.99 | `DECIMAL(10,2) CHECK (salary > 0)` |
| `hours_allocated` | whole number, 1 or more | `INT CHECK (hours_allocated > 0)` |
| `department_name`, `role` | string, 1 to 50 characters | `VARCHAR(50)` |
| ids in the body | whole number, 1 to 2147483647 | `INT` |
| ids and minimums in the URL | digits only, starting at 1 | the old `Number.isInteger(id) && id >= 1` checks |
| register password | 1 to 72 characters | bcrypt only uses the first 72 bytes |

### Design choices

- Unknown fields in a request **body** are rejected (a typo like `slary` gets a clear error instead of being ignored). Unknown **query** keys are allowed and ignored.
- Numbers in a body must be real JSON numbers (`"salary": "50000"` is rejected).
- Broken JSON gets a clean `400` ("Malformed JSON body").
- The database error handling (23502, 23503, 23505, 23514) is unchanged, because a schema cannot know about duplicates or missing foreign keys.

### Before and after

I ran the same requests against the old routes and the new ones (a fake database counted the calls):

| Request | Before | After |
|---|---|---|
| `POST /employees` with no body | 500 "Database error" (crashed on `req.body`) | 400 |
| `POST /employees` with `salary: 0` | went to the database | 400, no database call |
| `POST /employees` with `salary: "abc"` | went to the database | 400, no database call |
| `PUT /departments/1` with a number as the name | went to the database | 400, no database call |
| `GET /projects/0/employees` | not rejected | 400, no database call |
| `GET /stats/employees/active?minLogs=1` | 400 (stricter than the other three stats routes) | accepted |

### Other fixes found along the way

- `console.log(req.body)` in the refresh route could print request data into the logs. Removed.
- The id check on `GET /projects/:id/employees` used `id < 0`, so id 0 passed. Now every id must be 1 or more.
- Validation errors had three different response shapes. They now share one.
- Removed an unused import and the typos in the old messages ("feilds", "dosen't").

### Tests

```
npm test
```

84 tests (Node's built-in test runner, with a fake database, so no PostgreSQL is needed). They check that valid input is accepted, that every kind of bad input gets a `400` naming the field, and that the database is never called for a rejected request.

# Running Locally

Clone the repository
(git clone <repository-url>)

Install Dependencies
(npm install)

Create a .env file

.env contents
PORT = 3000

DB_HOST = localhost
DB_PORT = 5432
DB_USER = your_username
DB_PASSWORD = your_password
DB_NAME = your_database
JWT_SECRET = your_super_long_random_secret
NODE_ENV = development

Start the server
npm run dev

# Feature Improvement

1. Refactor API logic into a Controller-Service-Model Architecture
2. Move the database operations into the models/ layer
3. Move request/response handling into into controllers/
4. Add reusable middleware for validation, authentication, authorization and centralized error handling (validation Done)
5. Add JWT Based authentication(Done)
6. Add role-based authorization(Done)
7. Add API Documentation with Swagger/Open API
8. Add Automated testing(done)
9. Add Docker support
10. Build a React frontend for the Employee Management system
11. Connect the React frontend to the REST API
12. Deploy the API and PostgreSQL Database to the cloud
