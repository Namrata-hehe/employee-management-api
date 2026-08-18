import dotenv from "dotenv";
import pool from "./config/db.js";
import express from "express";
import employeeReads from "./routes/employee-reads.js";
import analytics from "./routes/analytics.js";
import adminWrites from "./routes/admin-writes.js";
import authRoutes from "./routes/auth.js";
import cookieParser from "cookie-parser";


const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.use(employeeReads);
app.use(analytics);
app.use(adminWrites);
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Employee Management API is running");
});

pool.
query("SELECT NOW()")
.then(() => console.log("Database connected"))
.catch((err) => console.log("Database connection failed", err));

app.use((req, res) => {
    res.status(404).json({
        success : false,
        message : "Route not found"
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});