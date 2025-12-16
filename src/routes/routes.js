import db from '../database/connect.js';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validInput, authorization } from '../util/validation.js';

const route = express.Router();
const key = process.env.JWT_SECRET;

/**
 * route to render a start page in html where user gets to choose
 * to login or register.
 */
route.get('/', (req, res) => {
    res.render('index');
});

/**
 * route to render a login page where user
 * can log in using username and password
 * and get a jwt token back.
 */
route.get('/login', (req, res) => {
    res.render('login');
});

route.post('/login', async (req, res) => {
    
    const userQuery = `SELECT * FROM User WHERE userName = ?;`;
    const { error, value } = validInput(req.body);
    try{
        if(error){
            return res.status(400).json({ message: error.details[0].message });
        }

        const { userName, password } = value;

        const [ rows ] = await db.query(userQuery, [userName]);
        const user = rows[0];
        if(!user){
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const checkPassword = await bcrypt.compare(password, user.password);
        if(!checkPassword){
            return res.status(401).json({ message: "Invalid credentials" });
        };

        const token = jwt.sign({ id: user.id, username: user.userName },
            key, { expiresIn: '5m' });
        res.status(200).json({ token });
    }catch(err){
        res.status(500).json({ message: "An error occured" });
    }
});

/**
 * route to render a register form will also return
 * a jwt token to user.
 */
route.get('/register', (req, res) => {
    res.render('register');
});

route.post('/register', async (req, res) => {
    const inserting = `INSERT INTO User (userName, password)
                       VALUES (?, ?);`;
    try{
        const { valid } = validInput(req.body);
        if(valid){
            return res.status(400).json({ message: "Invalid input format"});
        }

        const { userName, password } = req.body;
        const hashed = await bcrypt.hash(password, 10);

        await db.query(inserting, [userName, hashed]);

        res.status(201).json({ message: "New user registerd" });
    }catch(err){
        res.status(500).json({ message: "Internal error"});
    }
});

route.get('/addTask', (req, res) => {
    res.render('newTask');
});

route.get('/tasks', async (req, res) => {
    const selectTasks = 'SELECT * FROM Tasks;';
    try{
        const [ result ] = await db.query(selectTasks);
        if(result.length === 0){
            res.status(404).json('No tasks available');
        }
        res.status(200).json(...result);
    }catch(err){
        res.status(500).json('Internal error occured');
    }
});

route.get('/tasks/:id', async (req, res) => {
    const taskId = req.params.id;
    const task = 'SELECT * FROM Tasks WHERE id = ?;';
    try{
        const [ result ] = await db.query(task, taskId);
        if(result === 0){
            res.status(404).json('No task with that ID');
        }
        res.status(200).json(...result);
    }catch(err){
        res.status(500).json('Internal error occured');
    }
});

route.post('/tasks', authorization, async (req, res) => {
    const { title, description, status, userId } = req.body;
    try{
        if(task.userId !== req.user.id){
            return res.status(403).json({ message: "Not authorized for this action" });
        }
        const newTask = `INSERT INTO Tasks (title, description, status, userId)
                     VALUES (?, ?, ?, ?);`;
        await db.query(newTask,
            [title, description, status, userId]);
        res.status(201).json({ 
            success: true, 
            message: 'New task successfull created' });
    }catch(err){
        res.status(400).json({ 
            error: err.message,
            message: `Invalid request body, malformed or missing data` });
    }
});

route.put('/tasks/:id', authorization, async (req, res) => {
    const taskId = req.params.id;
    const { title, description, status } = req.body;
    const updateTask = `UPDATE Tasks SET
                        title = ?,
                        description = ?,
                        status = ?
                        WHERE id = ?;`;
    try{
        if(task.userId !== req.user.id){
            return res.status(403).json({ message: "Not authorized for this action" });
        }
        const [result] = await db.query(updateTask, [title, description, status, taskId]);
        if(result.affectedRows === 0){
            return res.status(404).json({ message: "Task not found" });
        }
        res.status(200).json({ message: `Update successfull!` });
    }catch(err){
        res.status(500).json({ message: `Internal error!`});
    }
});

route.patch('/tasks/:id', authorization, async (req, res) => {
    const taskId = req.params.id;
    let { title, description, status } = req.body;
    const updateTask = `UPDATE Tasks SET 
                        title = COALESCE(?, title),
                        description = COALESCE(?, description),
                        status = COALESCE(?, status)
                        WHERE id = ?;`;
    try{
        if(task.userId !== req.user.id){
            return res.status(403).json({ message: "Not authorized for this action" });
        }
        if(!title) title = null;
        if(!description) description = null;
        if(!status) status = null;

        const [result] = await db.query(updateTask, [title, description, status, taskId]);
        if(result.affectedRows === 0){
            return res.status(404).json({ message: "Can't find a task by that id" });
        }

        res.status(200).json({ success: true, message: `Update successfull!` });
    }catch(err){
        res.status(500).json({ error: err.message });
    }
});

route.delete('/tasks/:id', authorization, async (req, res) => {
    const taskId = req.params.id;
    const deleteQuery = `DELETE FROM Tasks WHERE id = ?;`;
    const selectQuery = `SELECT * FROM Tasks WHERE id = ?`;
    try{
        const [row] = await db.query(selectQuery, taskId);
        const task = row[0];

        if(task.userId !== req.user.id){
            return res.status(403).json({ message: "Not authorized for this action" });
        }
        await db.query(deleteQuery, taskId);
        res.status(204).json({ success: true, message: "Deletion successfull" });
    }catch(err){
        res.status(500).json({ error: err.message });
    }
});

export default route;