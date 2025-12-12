import db from '../database/connect.js';
import express from 'express';
//import { validInput, authorization } from '../util/validation.js';

const route = express.Router();

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
    const { userName, password } = req.body;
    const userQuery = `SELECT * FROM User WHERE userName = ?;`;
    try{
        
        const [ user ] = await db.query(userQuery, userName);
        if(!user){
            res.status(401).json({ message: "Invalid credentials" });
        }

        const checkPassword = await bcrypt.compare(password, user.password);
        if(!checkPassword){
            return res.status(401).json({ message: "Invalid credentials" });
        };

        const token = jwt.sign({ id: user.id, username: user.userName },
            process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
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

        await db.query(inserting, userName, hashed);

        res.status(201).json({ message: "New user registerd" });
    }catch(err){
        res.status(500).json({ message: "Internal error"});
    }
})

route.get('/addTask', (req, res) => {
    res.render('newTask');
})

route.get('/tasks', async (req, res) => {
    const selectTasks = 'SELECT * FROM Tasks;';
    try{
        const [ result ] = await db.query(selectTasks);
        if(result.length === 0){
            res.status(404).json('No tasks available');
        }
        res.status(200).json(result);
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
        res.status(200).json(result);
    }catch(err){
        res.status(500).json('Internal error occured');
    }
});

route.post('/tasks', async (req, res) => {
    const { title, description, status, userId } = req.body;
    try{
        //const valid = validInput(req.body);
        const newTask = `INSERT INTO Tasks (title, description, status, userId)
                     VALUES (?, ?, ?, ?);`;
        await db.query(newTask,
            [title, description, status, userId]);
            //[valid.title, valid.description, valid.status, req.user.userId]);
        res.status(201).json({ 
            success: true, 
            message: 'New task successfull created' });
    }catch(err){
        res.status(400).json({ 
            error: err.message,
            message: `Invalid request body, malformed or missing data` });
    }
});

route.put('/tasks/:id', async (req, res) => {
    const taskId = req.params.id;
    const { status } = req.body;
    const updateTask = `UPDATE Tasks SET status = ? WHERE id = ?;`;
    try{
        const [result] = await db.query(updateTask, [status, taskId]);
        console.log(taskId, status, result);
        if(result.affectedRows === 0){
            res.status(404).json({ message: "Can't find a task by that id" });
        }

        res.status(200).json({ success: true, message: "Update successfull!" });
    }catch(err){
        res.status(500).json({ error: err.message });
    }
});

route.delete('/tasks/:id', async (req, res) => {
    const taskId = req.params.id;
    const deleteQuery = `DELETE FROM Tasks WHERE id = ?;`
    try{
        const [ result ] = await db.query(deleteQuery, taskId);
        if(result.affectedRows === 0){
            res.status(404).json({ message: "No task with that id" });
        }
        res.status(204).json({ success: true, message: "Deletion successfull" });
    }catch(err){
        res.status(500).json({ error: err.message });
    }
});

export default route;