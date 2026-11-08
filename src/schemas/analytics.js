import { positiveIntegerString } from "./common.js";

// Each stats route needs one query value, for example ?minEmployees=3.
// Other query keys are allowed and ignored.
const queryWith = (name) => ({
    type: "object",
    properties: {
        [name]: positiveIntegerString
    },
    required: [name]
});

export const minEmployeesQuery = queryWith("minEmployees");
export const minHoursQuery = queryWith("minHours");
export const minProjectsQuery = queryWith("minProjects");
export const minLogsQuery = queryWith("minLogs");
