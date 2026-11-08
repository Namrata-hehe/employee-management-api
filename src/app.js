import dotenv from "dotenv";
import express from "express";
import employeeReads from "./routes/employee-reads.js";
import analytics from "./routes/analytics.js";
import adminWrites from "./routes/admin-writes.js";
import authRoutes from "./routes/auth.js";
import cookieParser from "cookie-parser";


const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(employeeReads);
app.use(analytics);
app.use(adminWrites);
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Employee Management API is running");
});

app.use((req, res) => {
    res.status(404).json({
        success : false,
        message : "Route not found"
    });
});

// Broken JSON in the request body, for example a missing quote
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success : false,
            message : "Malformed JSON body"
        });
    }
    next(err);
});

export default app;