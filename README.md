# Employee Management REST API

A backend REST API which is build using Node.js, Express and PostgreSQL. It helps managing Employees, Departments, Projects, Project Assignments and Work logs.
This project also demonstrates relational database design, SQL Joins, aggregation queries, database constraints and REST API development.

# Tech Stack

1. Node.js
2. Express.js
3. PostgreSQL
4. pg(node-postgres)
5. dotenv
6. Thunder Client (API Testing)

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

# Project Structure

src/
  |
  | - config/
         |-----db.js
  | 
  | - routes/
         | ------employee-reads.js
         | ------analytics.js
         | ------admin-writes.js
  |
  | - app.js

# Database Template

Employees
Departments
Projects
Project Assignments
Work Logs

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

#SQL Concepts Demonstrated

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

Start the server
npm run dev
