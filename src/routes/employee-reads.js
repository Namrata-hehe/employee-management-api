import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.get("/employees", async(req, res) => {
    try {
        const result = await pool.query("SELECT * FROM employees ORDER BY employee_id");
        res.json({
            count : result.rows.length,
            employees : result.rows
        });

    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            message : "Database error"
        });
    }
});

router.get("/departments/:id/employees", async(req, res) => {
    try {
        const id = Number(req.params.id);

        if(!Number.isInteger(id) || id < 1){
            return res.status(400).json({
                message : "Invalid Id"
            });
        }

        const result = await pool.query(`SELECT * FROM employees WHERE department_id = $1`, [id]);

        if(result.rows.length === 0){
            return res.status(200).json({
                success : true,
                message : "No employees found for this department",
                data : []
            });
        }

        return res.status(200).json({
            success : true,
            count : result.rows.count,
            data : result.rows
            
        });
    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            message : "Database error"
        });
    }
});

router.get("/employees/:id/projects", async(req, res) => {
    try {
        const id = Number(req.params.id);

        if(!Number.isInteger(id) || id <1) {
            return res.status(400).json({
                success : false,
                message : "Invalid employee ID"
            });
        }
        const result = await pool.query(
  `SELECT projects.project_id, projects.project_name, projects.start_date, projects.end_date, project_assignment.role, project_assignment.hours_allocated 
   FROM project_assignment 
   JOIN projects ON project_assignment.project_id = projects.project_id 
   WHERE project_assignment.employee_id = $1`, 
  [id]
);
        if(result.rows.length === 0){
            return res.status(200).json({
                status : true,
                message : "No employees present"
            });
        }

        return res.status(200).json({
            success : true,
            count : result.rows.length,
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

router.get("/projects/:id/employees", async(req, res) => {
    try {

        const id = Number(req.params.id);

        if(!Number.isInteger(id) || id < 0) {
            return res.status(400).json({
                success: false,
                data : [],
                message : "Invalid project id"
            });

        }

        const result = await pool.query(`SELECT employees.employee_id, employees.first_name, employees.last_name, employees.email, project_assignment.role, project_assignment.hours_allocated FROM project_assignment JOIN employees ON project_assignment.employee_id = employees.employee_id WHERE project_assignment.project_id = $1 `, [id]);

        if(result.rows.length === 0){
            return res.status(200).json({
                success : true,
                message : "No employees found for this project"
            });
        }

        return res.json({
            success : true,
            count : result.rows.length,
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

router.get("/employees/details", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        employees.employee_id,
        employees.first_name,
        employees.last_name,
        employees.email,
        employees.salary,
        departments.department_name,
        projects.project_name,
        project_assignment.role,
        project_assignment.hours_allocated
      FROM employees
      JOIN departments
        ON employees.department_id = departments.department_id
      LEFT JOIN project_assignment
        ON employees.employee_id = project_assignment.employee_id
      LEFT JOIN projects
        ON project_assignment.project_id = projects.project_id
      ORDER BY employees.employee_id
    `);

    const rows = result.rows;

    const employees = {};

    for (const row of rows) {

      if (!employees[row.employee_id]) {

        employees[row.employee_id] = {
          employee_id: row.employee_id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          salary: row.salary,
          department_name: row.department_name,
          projects: []
        };

      }

      if (row.project_name) {

        employees[row.employee_id].projects.push({
          project_name: row.project_name,
          role: row.role,
          hours_allocated: row.hours_allocated
        });

      }

    }

    const data = Object.values(employees);

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Database error"
    });
  }
});

export default router;