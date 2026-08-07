import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/stats/overview", async(req, res) => {
    try {
        const result = await pool.query(`SELECT (SELECT COUNT(*) FROM employees) AS total_employees, (SELECT COUNT(*) FROM departments) AS total_departments, (SELECT COUNT(*) FROM projects) AS total_projects, (SELECT COUNT(*) FROM work_logs) AS work_logs`);

        return res.json({
            success : true, 
            data : result.rows
        });

    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            success : false, 
            message : "Database error"
        });
    }
});

router.get("/stats/salaries", async(req, res) => {
    try {

        const result = await pool.query(`SELECT SUM(salary) AS total_salary, ROUND(AVG(salary):: numeric, 2) AS average_salary, MIN(salary) AS minimum_salary, MAX(salary) AS maximum_salary FROM employees`);

        return res.json({
            success : true,
            data : result.rows[0]
        });

    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            success : false,
            message : "Database error"
        });
    }
});

router.get("/stats/departments/employees", async(req, res) => {
    try {
        const result = await pool.query(`SELECT departments.department_id, departments.department_name, COUNT(employees.employee_id) AS employee_count FROM departments LEFT JOIN employees ON departments.department_id = employees.department_id GROUP BY departments.department_id, departments.department_name ORDER BY department_id`);

       return res.status(200).json({
        success: true,
        data: {
            departments: result.rows
        }
});

    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            success : false,
            message : "Database error"
        });
    }
});

router.get("/stats/departments/salaries", async(req, res) => {
    try {

        const result = await pool.query(`SELECT departments.department_name, COUNT(employees.employee_id) AS employee_count, COALESCE(SUM(employees.salary), 0) AS total_salary,  COALESCE(ROUND(AVG(employees.salary):: numeric, 2), 0) AS average_salary,  COALESCE(MIN(employees.salary), 0) AS minimum_salary,  COALESCE(MAX(employees.salary), 0) AS maximum_salary FROM departments LEFT JOIN employees on departments.department_id = employees.department_id GROUP BY departments.department_id, departments.department_name ORDER BY departments.department_id`)
        
        return res.json({
            success : true,
            data : {
                departments : result.rows
            }
        });

    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            success : false,
            message : "Database error"
        });
    }
});

router.get("/stats/departments/large", async(req, res) => {
    try {

        const count = Number(req.query.minEmployees);

        if(!Number.isInteger(count) || count<1){
            return res.status(400).json({
                success : false,
                message : "Invalid minimum employee count"
            });
        }

        const result = await pool.query(`SELECT departments.department_name, COUNT(employees.employee_id) AS employee_count FROM departments LEFT JOIN employees ON departments.department_id = employees.department_id GROUP BY departments.department_name HAVING COUNT(employees.employee_id) >= $1 ORDER BY employee_count DESC`, [count]);

        return res.json({
            success : true,
            data : {
                minimumEmployees : count,
                departments : result.rows
            }
        });
        
    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            success : false,
            message : "Database error"
        });
    }
});

router.get('/stats/projects/budget', async(req, res) => {
    try {

        const result = await pool.query(`SELECT COUNT(*) AS project_count, SUM(budget) AS total_budget, ROUND(AVG(budget):: numeric, 2) AS average_budget, MIN(budget) AS minimum_budget, MAX(budget) AS maximum_budget FROM projects`);

        return res.json({
            success : true,
            data : result.rows
        });

    }catch(err) {
        console.log(err.message);
        res.status(500).json({
            success : false,
            message : "Database error"
        });
    }
});

router.get("/stats/projects/employee_count", async(req, res) => {
    try {

        const result = await pool.query(`SELECT projects.project_id, projects.project_name, COUNT(project_assignment.employee_id) AS total_employees FROM projects LEFT JOIN project_assignment ON projects.project_id = project_assignment.project_id GROUP BY projects.project_id, projects.project_name ORDER BY projects.project_id`);

        res.json({
            success : true,
            data : result.rows
        });

    }catch(err) {
        console.log(err.message);
        res.status(500).json({
            success : false,
            message : "Database error"
        });
    }
});

router.get("/stats/projects/allocated_hours", async(req, res) => {
    try {
        const result = await pool.query(`SELECT projects.project_name, COUNT(project_assignment.employee_id) AS employee_count, COALESCE(SUM(project_assignment.hours_allocated), 0) AS total_allocated_hours, COALESCE(ROUND(AVG(project_assignment.hours_allocated) :: numeric, 2), 0) AS average_allocated_hours FROM projects LEFT JOIN project_assignment ON projects.project_id = project_assignment.project_id GROUP BY projects.project_name`);

        res.json({
            success : true,
            data : {
                projects : result.rows
            }
        });

    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            success : true,
            message : "Database error"
        });
    }
});

router.get('/stats/projects/overloaded', async(req, res) => {
    try {

        const overloaded = Number(req.query.minHours);

        if(!Number.isInteger(overloaded) || overloaded<1){
            return res.status(400).json({
                success : false,
                message : "Invalid minimum hours allocated to the project"
            });
        }

        const result = await pool.query(`SELECT projects.project_name, COALESCE(SUM(project_assignment.hours_allocated), 0) AS total_allocated_hours FROM projects LEFT JOIN project_assignment ON  projects.project_id = project_assignment.project_id GROUP BY projects.project_name HAVING SUM(project_assignment.hours_allocated) >= $1`, [overloaded]);

        res.json({
            success : true,
            data : {
                minimum_hours : overloaded,
                projects : result.rows
            }
        });

    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            success : false,
            message : "Database error"
        });
    }
});

router.get('/stats/employees/project_workload', async(req, res) => {
    try {

        const result = await pool.query(`SELECT employees.employee_id, CONCAT(employees.first_name ,' ', employees.last_name) AS employee_name, COUNT(project_assignment.project_id) AS project_count, SUM(project_assignment.hours_allocated) AS total_allocated_hours, AVG(project_assignment.hours_allocated) AS average_hours_per_project FROM employees LEFT JOIN project_assignment ON employees.employee_id = project_assignment.employee_id GROUP BY employees.employee_id, employees.first_name, employees.last_name ORDER BY total_allocated_hours DESC`);

        return res.json({
            success : true,
            data : {
                employees : result.rows
            }
        });
        
    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            success : false,
            message : "Database error"
        });
    }
});

router.get("/stats/employees/multi-projects", async(req, res) => {
    try {

        const minProj = Number(req.query.minProjects);

        if(!Number.isInteger(minProj) || minProj < 1) {
            return res.status(400).json({
                success : false,
                message : "Invalid minimum project value"
            });
        }

        const result = await pool.query(`SELECT CONCAT(employees.first_name, ' ', employees.last_name) AS employee_name, COUNT(project_assignment.project_id) AS project_count FROM employees JOIN project_assignment ON employees.employee_id = project_assignment.employee_id GROUP BY employees.employee_id, employees.first_name, employees.last_name HAVING COUNT(project_assignment.project_id)>=$1`, [minProj]);

        return res.json({
            success : true,
            minimum_projects : minProj,
            employees : result.rows
        });

    } catch(err) {
        console.log(err.message);
        return res.status(500).json({
            success : false,
            message : "Database error"
        });
    }
});


router.get("/stats/work_logs/status", async(req, res) => {
    try {

        const result = await pool.query(`SELECT work_logs.status, COUNT(*) AS log_count FROM work_logs GROUP BY work_logs.status`);

        return res.json({
            success : true,
            work_logs : result.rows
        });

    } catch(err){
        console.log(err.message);
        return res.status(500).json({
            success : false,
            message : "Database error"
        });
    }
});

router.get("/stats/employees/work_logs", async(req, res) => {
    try {

        const result = await pool.query(`SELECT CONCAT(employees.first_name, ' ', employees.last_name) AS employee_name, COUNT(work_logs.employee_id) AS work_log_count FROM employees JOIN work_logs ON employees.employee_id = work_logs.employee_id GROUP BY employees.employee_id, employees.first_name, employees.last_name`);

        res.json({
            success : true,
            employees : result.rows
        });

    } catch(err) {
        console.log(err.message);
        return res.status(500).json({
            success : false,
            message : "Database error"
        });
    }
});

router.get("/stats/employees/active", async(req, res) => {
    try {

        const minCount = Number(req.query.minLogs);

        if(!Number.isInteger(minCount) || minCount<= 1){
            return res.status(400).json({
                success:false,
                message:"Invalid minimum logs count"
            });
        }

        const result = await pool.query(`SELECT CONCAT(employees.first_name, ' ', employees.last_name) AS employee_name, COUNT(work_logs.employee_id) AS work_log_count FROM employees JOIN work_logs ON employees.employee_id = work_logs.employee_id GROUP BY employees.employee_id, employees.first_name, employees.last_name HAVING COUNT(work_logs.employee_id) >= $1`, [minCount]);

        res.json({
            success:true,
            minimum_logs : minCount,
            employees : result.rows
        });

    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            success:false,
            message:"Database error"
        });
    }
});


router.get("/stats/dashboard", async(req, res) => {
    try {

        const result = await pool.query(`SELECT
            (SELECT COUNT(*) FROM employees) AS total_employees,
            (SELECT COUNT(*) FROM departments) AS total_departments,
            (SELECT COUNT(*) FROM projects) AS total_projects,
            
            (SELECT SUM(salary) FROM employees) AS total_salary,
            (SELECT ROUND(AVG(salary)::numeric, 2) FROM employees) AS average,
            (SELECT MIN(salary) FROM employees) AS minimum,
            (SELECT MAX(salary) FROM employees) AS maximum,
            
            (SELECT SUM(budget) FROM projects) AS total_budget,
            
            (SELECT SUM(hours_allocated) FROM project_assignment) AS total_allocated_hours,
            
            (SELECT COUNT(*) FROM work_logs) AS total,
            (SELECT COUNT(*) FROM work_logs WHERE status='pending') AS pending,
            (SELECT COUNT(*) FROM work_logs WHERE status='completed') AS completed` );

            const stats = result.rows[0];

            res.json({
                success : true,
                data : {
                    company : {
                        total_employees : Number(stats.total_employees),
                        total_departments : Number(stats.total_departments),
                        total_projects : Number(stats.total_projects)
                    }
                    ,
                    salary : {
                        total_salary : Number(stats.total_salary),
                        average : Number(stats.average),
                        minimum : Number(stats.minimum),
                        maximum : Number(stats.maximum)
                    },

                    projects : {
                        total_budget : Number(stats.total_budget),
                        total_allocated_hours : Number(stats.total_allocated_hours)
                    },

                    work_logs : {
                        total : Number(stats.total),
                        pending : Number(stats.pending),
                        completed : Number(stats.completed)
                    }
                }
            });

    } catch(err){
        console.log(err.message);
        return res.status(500).json({
            success: false,
            message: "Database error"
        });
    }
});
export default router;