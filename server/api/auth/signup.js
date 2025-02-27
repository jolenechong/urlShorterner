// import { User } from "../../models/user.model";
import pool from "../../index.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import keys from "./../../keys.js";

async function signup(req, res) {

    // destructure body
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) { return res.json({"message":"Please fill up all fields."}).end(); }
    if (password !== confirmPassword){ return res.json({"message":"Passwords should be the same."}).end();}

    try {

        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows[0]) { return res.status(409).json({"message":"Email already in use."}).end(); }

        const passwordEncrypt = bcrypt.hashSync(password, 10);

        const newUser = await pool.query(
            `INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *`,
            [email, passwordEncrypt]
        );
        
        if (!keys.jwtSecret) { return res.status(500).json({"message": "Missing Secret"}); }
        const token = jwt.sign({ id: newUser.rows[0].id, email: newUser.rows[0].email }, keys.jwtSecret);

        res.cookie('token', token);

        return res.json({
            id: newUser.rows[0].id,
            email: newUser.rows[0].email,
        }).end();

    } catch (err) {
        console.error(err);
        return res.status(500).end("Internal Error Occurred.");
    }

}

export default signup;