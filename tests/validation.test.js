import { test, describe, before, after, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import pool from "../src/config/db.js";
import app from "../src/app.js";

let server;
let baseUrl;

before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
});

// Every test gets a fake database, so no real database is needed
beforeEach(() => {
    mock.method(pool, "query", async () => ({ rows: [] }));
});

afterEach(() => {
    mock.restoreAll();
});

function useDb(handler) {
    pool.query.mock.mockImplementation(handler);
}

async function send(method, path, body, rawBody) {
    const options = { method, headers: {} };
    const payload = rawBody ?? (body === undefined ? undefined : JSON.stringify(body));
    if (payload !== undefined) {
        options.headers["Content-Type"] = "application/json";
        options.body = payload;
    }
    const res = await fetch(baseUrl + path, options);
    return { status: res.status, data: await res.json() };
}

// A bad request must get a 400 that names the field, before any database call
async function assertRejected(method, path, body, field) {
    const { status, data } = await send(method, path, body);
    assert.equal(status, 400);
    assert.equal(data.success, false);
    assert.equal(data.message, "Validation failed");
    assert.ok(
        data.errors.some((e) => e.field === field),
        `expected an error for ${field}, got ${JSON.stringify(data.errors)}`
    );
    assert.equal(pool.query.mock.callCount(), 0, "the database must not be called");
}

// A good request must not be rejected by validation
async function assertNotRejected(method, path, body) {
    const { status } = await send(method, path, body);
    assert.notEqual(status, 400);
}

const employee = {
    first_name: "Asha",
    last_name: "Rao",
    email: "asha@company.com",
    salary: 50000,
    department_id: 1
};

describe("POST /employees", () => {
    test("accepts a valid employee", async () => {
        useDb(async () => ({ rows: [{ employee_id: 1, ...employee }] }));
        const { status } = await send("POST", "/employees", employee);
        assert.equal(status, 201);
        assert.equal(pool.query.mock.callCount(), 1);
    });

    const bad = [
        ["a missing last_name", { ...employee, last_name: undefined }, "body.last_name"],
        ["an empty first_name", { ...employee, first_name: "" }, "body.first_name"],
        ["a first_name over 30 characters", { ...employee, first_name: "x".repeat(31) }, "body.first_name"],
        ["an invalid email", { ...employee, email: "nope" }, "body.email"],
        ["a salary of 0", { ...employee, salary: 0 }, "body.salary"],
        ["a negative salary", { ...employee, salary: -5 }, "body.salary"],
        ["a salary sent as a string", { ...employee, salary: "50000" }, "body.salary"],
        ["a salary above the column limit", { ...employee, salary: 100000000 }, "body.salary"],
        ["a department_id of 0", { ...employee, department_id: 0 }, "body.department_id"],
        ["a department_id sent as a string", { ...employee, department_id: "1" }, "body.department_id"],
        ["an unknown field", { ...employee, extra: 1 }, "body.extra"]
    ];
    for (const [name, body, field] of bad) {
        test(`rejects ${name}`, () => assertRejected("POST", "/employees", body, field));
    }

    test("rejects a request with no body", () =>
        assertRejected("POST", "/employees", undefined, "body.first_name"));

    test("answers broken JSON with a clean 400", async () => {
        const { status, data } = await send("POST", "/employees", undefined, '{"first_name": ');
        assert.equal(status, 400);
        assert.equal(data.message, "Malformed JSON body");
    });
});

describe("PUT /departments/:id", () => {
    test("accepts a valid update", async () => {
        useDb(async () => ({ rows: [{ department_id: 1, department_name: "HR" }] }));
        const { status } = await send("PUT", "/departments/1", { department_name: "HR" });
        assert.equal(status, 200);
    });

    for (const id of ["abc", "0", "-1", "1.5"]) {
        test(`rejects the id "${id}"`, () =>
            assertRejected("PUT", `/departments/${id}`, { department_name: "HR" }, "params.id"));
    }

    const bad = [
        ["a missing department_name", {}, "body.department_name"],
        ["an empty department_name", { department_name: "" }, "body.department_name"],
        ["a department_name over 50 characters", { department_name: "x".repeat(51) }, "body.department_name"],
        ["a department_name that is a number", { department_name: 5 }, "body.department_name"],
        ["an unknown field", { department_name: "HR", extra: 1 }, "body.extra"]
    ];
    for (const [name, body, field] of bad) {
        test(`rejects ${name}`, () => assertRejected("PUT", "/departments/1", body, field));
    }
});

describe("DELETE routes", () => {
    for (const path of ["/departments", "/employees"]) {
        for (const id of ["abc", "0"]) {
            test(`DELETE ${path}/${id} is rejected`, () =>
                assertRejected("DELETE", `${path}/${id}`, undefined, "params.id"));
        }
    }
});

describe("POST /project_assignment", () => {
    const assignment = { project_id: 1, employee_id: 2, role: "Developer", hours_allocated: 10 };

    test("accepts a valid assignment", async () => {
        useDb(async () => ({ rows: [{ assignment_id: 1, ...assignment }] }));
        const { status } = await send("POST", "/project_assignment", assignment);
        assert.equal(status, 200);
    });

    const bad = [
        ["a missing role", { ...assignment, role: undefined }, "body.role"],
        ["hours_allocated of 0", { ...assignment, hours_allocated: 0 }, "body.hours_allocated"],
        ["hours_allocated as a string", { ...assignment, hours_allocated: "5" }, "body.hours_allocated"],
        ["a project_id of 0", { ...assignment, project_id: 0 }, "body.project_id"],
        ["an employee_id as a string", { ...assignment, employee_id: "2" }, "body.employee_id"],
        ["a role over 50 characters", { ...assignment, role: "x".repeat(51) }, "body.role"],
        ["an unknown field", { ...assignment, extra: 1 }, "body.extra"]
    ];
    for (const [name, body, field] of bad) {
        test(`rejects ${name}`, () => assertRejected("POST", "/project_assignment", body, field));
    }
});

describe("POST /auth/register", () => {
    const user = { email: "a@company.com", password: "secret123" };

    test("accepts a valid user", async () => {
        useDb(async (sql) =>
            sql.includes("INSERT")
                ? { rows: [{ user_id: 1, email: user.email, created_at: "now" }] }
                : { rows: [] });
        const { status } = await send("POST", "/auth/register", user);
        assert.equal(status, 201);
    });

    const bad = [
        ["a missing password", { email: user.email }, "body.password"],
        ["a missing email", { password: user.password }, "body.email"],
        ["an invalid email", { ...user, email: "nope" }, "body.email"],
        ["an empty password", { ...user, password: "" }, "body.password"],
        ["a password over 72 characters", { ...user, password: "x".repeat(73) }, "body.password"],
        ["an attempt to set the role", { ...user, role: "admin" }, "body.role"]
    ];
    for (const [name, body, field] of bad) {
        test(`rejects ${name}`, () => assertRejected("POST", "/auth/register", body, field));
    }

    test("rejects a request with no body", () =>
        assertRejected("POST", "/auth/register", undefined, "body.email"));
});

describe("POST /auth/login", () => {
    test("a valid body passes validation (unknown user gets 401, not 400)", async () => {
        const { status } = await send("POST", "/auth/login", { email: "a@company.com", password: "x" });
        assert.equal(status, 401);
    });

    test("rejects a missing password", () =>
        assertRejected("POST", "/auth/login", { email: "a@company.com" }, "body.password"));

    test("rejects an invalid email", () =>
        assertRejected("POST", "/auth/login", { email: "nope", password: "x" }, "body.email"));

    test("rejects a request with no body", () =>
        assertRejected("POST", "/auth/login", undefined, "body.email"));
});

describe("routes with an id in the path", () => {
    const paths = ["/departments/%s/employees", "/employees/%s/projects", "/projects/%s/employees"];
    for (const template of paths) {
        for (const id of ["abc", "0", "-1"]) {
            const path = template.replace("%s", id);
            test(`GET ${path} is rejected`, () => assertRejected("GET", path, undefined, "params.id"));
        }
        const valid = template.replace("%s", "1");
        test(`GET ${valid} passes validation`, () => assertNotRejected("GET", valid));
    }
});

describe("stats routes with a minimum in the query", () => {
    const routes = [
        ["/stats/departments/large", "minEmployees"],
        ["/stats/projects/overloaded", "minHours"],
        ["/stats/employees/multi-projects", "minProjects"],
        ["/stats/employees/active", "minLogs"]
    ];
    for (const [path, key] of routes) {
        test(`${path} rejects a missing ${key}`, () => assertRejected("GET", path, undefined, `query.${key}`));
        for (const value of ["0", "abc", "-2"]) {
            test(`${path} rejects ${key}=${value}`, () =>
                assertRejected("GET", `${path}?${key}=${value}`, undefined, `query.${key}`));
        }
        for (const value of ["1", "3"]) {
            test(`${path} accepts ${key}=${value}`, () =>
                assertNotRejected("GET", `${path}?${key}=${value}`));
        }
    }
});