-- Departments Table
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(50) NOT NULL 
);

--Employees table
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(30) NOT NULL, 
    last_name VARCHAR(30) NOT NULL, 
    email VARCHAR(100) UNIQUE,
    salary DECIMAL(10, 2) CHECK (salary>0), 
    hire_date DATE DEFAULT CURRENT_DATE,
    department_id INT REFERENCES departments(department_id)
);

--Projects Table
CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(50) NOT NULL, 
    budget DECIMAL(12, 2),
    start_date DATE,
    end_date DATE
);

-- Project Assignment
CREATE TABLE project_assignment (
    assignment_id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(project_id) ON DELETE CASCADE,
    employee_id INT REFERENCES employees(employee_id) ON DELETE CASCADE,
    role VARCHAR(50), 
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hours_allocated INT CHECK (hours_allocated > 0),
    UNIQUE(project_id, employee_id) 
);

--work logs
CREATE TABLE work_logs (
    log_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id),
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,                
    metadata JSONB,                 
    status VARCHAR(20) DEFAULT 'pending' 
);

--users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'employees';

UPDATE users SET role = 'admin' WHERE email = 'admin@company.com';
SELECT * FROM users;

CREATE TABLE refresh_tokens(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    expired_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);