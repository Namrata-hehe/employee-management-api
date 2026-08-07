import express from "express";
import pool from "../config/db.js";

const router = express.Router();

router.post("/employees", async(req, res) => {
    try {

        const {first_name, last_name, email, salary, department_id} = req.body;

        if(!first_name || !last_name || !email || salary == null || department_id == null){
            return res.status(400).json({
                success : false,
                message : "All feilds are required"
            });
        }

        const result = await pool.query(`INSERT INTO employees(first_name, last_name, email, salary, department_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [first_name, last_name, email, salary, department_id]);

        return res.status(201).json({
            success : true,
            message : "Employee created successfully",
            data : result.rows[0]
        });

    } catch (err) {

        console.log("DB Error code:", err.code);
        console.log(err.message);

        if(err.code === "23502") {
            return res.status(400).json({
                success : false,
                message : "Name of the employee is missing"
            });
        }

        if(err.code === "23505") {
            return res.status(409).json({
                success : false,
                message : "Email is already in use. Please use a different one"
            });
        }

        if(err.code === "23514") {
            return res.status(400).json({
                success : false,
                message : "Salary must be positive or greter than zero"
            });
        }

        if(err.code === "23503") {
            return res.status(400).json({
                success : false,
                message : "Department ID dosen't exist"
            });
        }

        return res.status(500).json({
            success : false, 
            message : "Database error"
        });

    }
});

router.delete("/departments/:id", async(req, res) => {
    try {

        const id = Number(req.params.id);

        if(!Number.isInteger(id) || id < 1){
            return res.status(400).json({
                success : false,
                message : "Invalid department id"
            });
        }

        const result = await pool.query(`DELETE FROM departments WHERE department_id = $1 RETURNING *`, [id]);

        if(result.rows.length === 0){
            return res.status(404).json({
                success : false,
                message : "Department not found"
            });
        }

        return res.status(200).json({
            success : true,
            message : "Department deleted",
            data : result.rows[0]
        });
        
    } catch(err) {
        console.log(err.message);

        if(err.code === "23503") {
            return res.status(400).json({
                success : false,
                message : "The department is already assigned to employees, hence cannot delete it!"
            });
        }
        res.status(500).json({
            success : false,
            message : "Database error"
        });
    }
});  


router.delete("/employees/:id", async(req, res) => {
    try {

        const id = Number(req.params.id);

        if(!Number.isInteger(id) || id < 1){
            return res.status(400).json({
                success : false,
                message : "Invalid employee id"
            });
        }

        const result = await pool.query(`DELETE FROM employees WHERE id = $1 RETURNING *`, [id]);

        if(result.rows.length === 0){
            return res.status(400).json({
                success : false, 
                message : "Employee not found!"
            });
        }

        res.json({
            success : true,
            message : "Employee deleted",
            data : result.rows[0]
        });

    } catch(err) {
        console.log(err.message);

        if(err.code === "23503"){
            res.status(400).json({
                success : false, 
                message : "Employees are connected to other tables, either to departments, project_assignments or work_logs, hence cannot delete it!"
            });
        }
        return res.status(500).json({
            success : false, 
            message : "Database error"
        });
    }
}); 

router.put("/departments/:id", async(req, res) => {
    try {

        const id = Number(req.params.id);

        if(!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                success : false, 
                message : "Invalid department id"
            });
        }

        const {department_name} = req.body;

        if(!department_name){
            return res.status(400).json({
                success : false,
                message : "Department name dosen't exist"
            });
        }

        const result = await pool.query(`UPDATE departments SET department_name = $1 WHERE department_id = $2 RETURNING *`, [department_name, id]);

        if(result.rows.length === 0){
            return res.status(404).json({
                success : false,
                message : "Department not found"
            });
        }

        res.json({
            success : true,
            message : "Departments updated successfully",
            data : result.rows[0]
        });

    } catch(err) {
        console.log(err.message);
        return res.status(500).json({
            success : false, 
            message : "Database error"
        });
    }
}); 

router.post("/project_assignment", async(req, res) => {
    try {

        const { project_id, employee_id, role, hours_allocated } = req.body;

        if(project_id == null || employee_id == null || !role || hours_allocated == null) {
            return res.status(400).json({
                success : false, 
                message : "All feilds are required"
            });
        }

        const result = await pool.query(`INSERT INTO project_assignment (project_id, employee_id, role, hours_allocated) VALUES ($1, $2, $3, $4) RETURNING *`, [project_id, employee_id, role, hours_allocated]);

        res.json({
            success : true, 
            message : "Project assigned successfully",
            data : result.rows[0]
        });

    } catch(err) {
        console.log(err.message);

        if(err.code === "23503"){
            return res.status(400).json({
                success : false, 
                message : "Either project_id or employee_id is invalid"
            });
        }

        if(err.code === "23514") {
            return res.status(400).json({
                success : false,
                message : "Hours allocated cannot be negative or empty"
            });
        }

        if(err.code === "23505"){
            return res.status(409).json({
                success : false,
                message : "Employee is already assigned to this project"
            });
        }
        return res.status(500).json({
            success : false,
            message : "Database error"
        });
    }
}); 

router.get("/schema/health", (req, res) => {
    res.status(200).json({
        success : true,
        data : {
            constraints : {
                primary_key : 5,
                foreign_key : 4,
                unique_constraints : 2,
                check_constraints : 2
            },

            cascade_rules : {
                project_assignment : "ON DELETE CASCADE"
            }
        }
    });
});

export default router;