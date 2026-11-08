import pool from "./config/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

pool.
query("SELECT NOW()")
.then(() => console.log("Database connected"))
.catch((err) => console.log("Database connection failed", err));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});