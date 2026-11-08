import { positiveInteger } from "./common.js";

// Limits below come from schema.sql

export const createEmployeeBody = {
    type: "object",
    properties: {
        // VARCHAR(30) NOT NULL
        first_name: { type: "string", minLength: 1, maxLength: 30 },
        last_name: { type: "string", minLength: 1, maxLength: 30 },
        // VARCHAR(100) UNIQUE
        email: { type: "string", format: "email", maxLength: 100 },
        // DECIMAL(10, 2) CHECK (salary > 0)
        salary: { type: "number", exclusiveMinimum: 0, maximum: 99999999.99 },
        department_id: positiveInteger
    },
    required: ["first_name", "last_name", "email", "salary", "department_id"],
    additionalProperties: false
};

export const updateDepartmentBody = {
    type: "object",
    properties: {
        // VARCHAR(50) NOT NULL
        department_name: { type: "string", minLength: 1, maxLength: 50 }
    },
    required: ["department_name"],
    additionalProperties: false
};

export const createAssignmentBody = {
    type: "object",
    properties: {
        project_id: positiveInteger,
        employee_id: positiveInteger,
        // VARCHAR(50)
        role: { type: "string", minLength: 1, maxLength: 50 },
        // INT CHECK (hours_allocated > 0)
        hours_allocated: positiveInteger
    },
    required: ["project_id", "employee_id", "role", "hours_allocated"],
    additionalProperties: false
};
