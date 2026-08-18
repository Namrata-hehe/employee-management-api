import express from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import { authenticate } from "../middlewares/authMiddleware.js";
import crypto from "crypto";
import { ref } from "process";
import strict from "assert/strict";



const router = express.Router();

router.post("/register", async(req, res) => {

    

    try {
        const{email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                success : false,
                message : "Email and password are required"
            });
        }

        const existingUser = await pool.query(`SELECT user_id FROM users WHERE email=$1`, [email]);

        if(existingUser.rows.length > 0) {
            return res.status(409).json({
                success : false,
                message : "Email already exists"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(`INSERT INTO users (email, password_hash) VALUES($1, $2) RETURNING user_id, email, created_at`, [email, passwordHash]);

        return res.status(201).json({
            success : true, 
            message : "User registered succesfully",
            user : result.rows[0]
        });

    } catch(err) {
        console.error("Registration error", err);
        res.status(500).send({
            success : false,
            message : "Internal server error"
        });
    }
});

router.post('/login', async(req, res) => {
    try {

        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                success : false,
                message : "Email and password are required"
            });
        }

        const result = await pool.query(`SELECT user_id, email, password_hash, role FROM users WHERE email = $1`, [email]);

        if(result.rows.length === 0){
            return res.status(401).json({
                success : false,
                message : "Invalid email or password"
            });
        }

        const user = result.rows[0];

        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

        if(!isPasswordCorrect){
            return res.status(401).json({
                success : false,
                message : "Invalid email or password"
            });
        }

        const access_token = jwt.sign({
            user_id : user.user_id,
            email : user.email, 
            role : user.role
        },

        process.env.JWT_SECRET,

        {
            expiresIn : "15m"
        }
        );

       const refreshTokens = crypto.randomBytes(64).toString("hex");

       const  refreshTokenHash = crypto.createHash("sha256").update(refreshTokens).digest("hex");

       const expiresAt = new Date();
       expiresAt.setDate(expiresAt.getDate() + 7);

       await pool.query(`INSERT INTO refresh_tokens (user_id, token_hash, expired_at) VALUES ($1, $2, $3)`, [user.user_id, refreshTokenHash, expiresAt]);

       res.cookie('refreshToken', refreshTokens, {
        httpOnly : true,
        secure : false, 
        sameSite : "strict",
        maxAge : 7 * 24 * 60 * 60 * 1000
       });

        return res.status(200).json({
            success : true,
            message : "Login successful",
            accessToken : access_token,
            
        });

    } catch(err){
        console.error("Login error: ", err);
        return res.status(500).json({
            success : false,
            message : "Internal server error"
        });
    }
});

router.get("/me", authenticate, async(req, res) => {
    try {
        const result = await pool.query(`SELECT user_id, email, created_at, role FROM users WHERE user_id = $1`, [req.user.user_id]);

        if(result.rows.length === 0){
            return res.status(404).json({
                message : "User not found"
            });
        }

        res.json({
            user : result.rows[0]
        });


    } catch(err) {
        console.error(err);
        return res.status(500).json({
            message : "Database error"
        });
    }
});

router.post("/refresh", async(req, res) => {

    console.log(req.body);

    try {

        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken) {
            return res.status(401).json({
                success : false,
                message : "Refresh Token required"
            });
        }

        const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('Hex');

        const result = await pool.query(`SELECT id, user_id, expired_at, revoked_at FROM refresh_tokens WHERE token_hash = $1`, [refreshHash]);

        if(result.rows.length === 0){
            return res.status(401).json({
                success : false,
                message : "Invalid refresh token"
            });
        }

        const session = result.rows[0];

        if(session.revoked_at !== null){
            return res.status(401).json({
                success : false,
                message : "Refresh token has been revoked"
            });
        }

        if(new Date(session.expires_at) <= new Date()) {
            return res.status(401).json({
                success : false,
                message : "Refresh token has expired"
            });
        }

        const userResult = await pool.query(`SELECT user_id, email, role FROM users WHERE user_id = $1`, [session.user_id]);

        
        if(userResult.rows.length === 0){
            return res.status(401).json({
                success : false,
                message : "User not found"
            });
        }

        const user = userResult.rows[0];


        await pool.query(`UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1`, [session.id]);

        const accessToken = jwt.sign({
            user_id : user.user_id,
            email : user.email, 
            role : user.role
        },

        process.env.JWT_SECRET,

        {
            expiresIn : "15m"
        }
        );

        const newRefreshToken = crypto.randomBytes(64).toString("hex");

        const newRefTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('Hex');

        const expiresAt = new Date();
       expiresAt.setDate(expiresAt.getDate() + 7);

       await pool.query(`INSERT INTO refresh_tokens (user_id, token_hash,  expired_at) VALUES ($1, $2, $3)`, [user.user_id, newRefTokenHash, expiresAt]);

        res.cookie('refreshToken', refreshToken, {
            httpOnly : true,
            secure : process.env.NODE_ENV === "production",
            sameSite : "strict",
            maxAge : 7 * 24 * 60 * 60 * 1000
        });

       return res.status(200).json({
        success : true,
        message : "Tokens refreshed successfully",
        accessToken,
       });

    }catch(err) {
        console.error("Refresh Token error", err);
        return res.status(500).json({
            success : false,
            message : "Internal Server error"
        });
    }
});

router.post("/logout", async(req, res) => {
    try {

        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken) {
            return res.status(200).json({
                success : true,
                message : "Already logged out"
            });
        }

        const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        await pool.query(`UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1 AND revoked_at IS NULL`, [tokenHash]);

        res.clearCookie("refreshToken", {
            httpOnly : true,
            secure : process.env.NODE_ENV === 'production',
            sameSite : 'strict'
        });

        return res.status(200).json({
            success : true,
            message : "User logged out"
        });

    } catch(err) {
        console.log("Error while logging out", err);

        return res.status(500).json({
            success : false,
            message : "Internal server error"
        });
    }
});


export default router;