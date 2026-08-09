--Departments

INSERT INTO departments (department_id, department_name)
VALUES
(1, 'Engineering'),
(2, 'Marketing'),
(3, 'Human Resources'),
(4, 'Sales'),
(5, 'Project Management'),
(6, 'Customer support');

--Employees

INSERT INTO employees
(employee_id, first_name, last_name, email, salary, hire_date, department_id)
VALUES
(1, 'Alice', 'Smith', 'alice@company.com', 95000.00, '2022-01-01', 1),
(2, 'Bob', 'Jones', 'bob@company.com', 80000.00, '2022-02-15', 1),
(3, 'Charlie', 'Davis', 'charlie@company.com', 60000.00, '2023-03-10', 2),
(4, 'David', 'Miller', 'david@company.com', 75000.00, '2022-05-20', 1),
(5, 'Eve', 'Wilson', 'eve@company.com', 110000.00, '2021-11-15', 1),
(6, 'Frank', 'Thomas', 'frank@company.com', 55000.00, '2023-01-10', 4),
(7, 'Grace', 'Lee', 'grace@company.com', 65000.00, '2023-06-01', 5),
(8, 'Heidi', 'Garcia', 'heidi@company.com', 72000.00, '2023-08-12', 2),
(9, 'Ivan', 'Ivanov', 'ivan@company.com', 48000.00, '2024-01-05', 6);

--Projects

INSERT INTO projects
(project_id, project_name, budget, start_date, end_date)
VALUES
(1, 'Cloud Migration', 50000.00, '2024-01-01', NULL),
(2, 'Brand Refresh', 20000.00, '2024-02-01', NULL),
(3, 'Security Audit', 15000.00, '2024-03-01', '2024-04-15'),
(4, 'Mobile App Launch', 120000.00, '2024-05-01', NULL),
(5, 'Employee Wellness Portal', 5000.00, '2024-01-15', '2024-02-15');

--Project Assignments

INSERT INTO project_assignment
(assignment_id, project_id, employee_id, role, assigned_at, hours_allocated)
VALUES
(1, 1, 1, 'Lead Architect', '2026-07-17 21:31:22.44754', 40),
(2, 1, 2, 'DevOps Engineer', '2026-07-17 21:31:22.44754', 30),
(3, 2, 3, 'Graphic Designer', '2026-07-17 21:31:22.44754', 20),
(4, 1, 4, 'Security Lead', '2026-07-30 21:35:30.547995', 25),
(5, 3, 1, 'Technical Advisor', '2026-07-30 21:35:30.547995', 10),
(6, 4, 5, 'Project Manager', '2026-07-30 21:35:30.547995', 40),
(7, 4, 1, 'Backend Dev', '2026-07-30 21:35:30.547995', 15),
(8, 4, 2, 'QA Engineer', '2026-07-30 21:35:30.547995', 20),
(9, 2, 6, 'Marketing Lead', '2026-07-30 21:35:30.547995', 35);

--Work logs

INSERT INTO work_logs
(log_id, employee_id, log_date, description, metadata, status)
VALUES
(1, 1, '2026-07-17 21:31:40.613858',
 'Configured the production VPC and subnets.',
 '{"os":"Linux","browser":"Firefox","urgency":"high"}',
 'completed'),

(2, 2, '2026-07-17 21:31:40.613858',
 'Set up CI/CD pipelines for the migration.',
 '{"os":"Windows","browser":"Chrome","urgency":"medium"}',
 'pending'),

(3, 1, '2026-07-30 21:35:38.068019',
 'Updated firewall rules for the Cloud Migration.',
 '{"tags":["infrastructure","security"],"priority":1}',
 'completed'),

(4, 4, '2026-07-30 21:35:38.068019',
 'Conducted initial penetration testing.',
 '{"risk_level":"high","tools_used":["Nmap","Metasploit"]}',
 'pending'),

(5, 5, '2026-07-30 21:35:38.068019',
 'Drafted roadmap for Mobile App.',
 '{"attendees":5,"meeting_notes_link":"http://docs.com/123"}',
 'completed'),

(6, 3, '2026-07-30 21:35:38.068019',
 'Finalized color palette for Brand Refresh.',
 '{"version":"2.1","software":"Figma"}',
 'completed'),

(7, 6, '2026-07-30 21:35:38.068019',
 'Gathered requirements for the Wellness portal.',
 '{"department":"HR","survey_count":50}',
 'pending');
