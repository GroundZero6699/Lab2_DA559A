import db from '../database/connect.js';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validInput, authorization } from '../util/validation.js';

const route = express.Router();
const key = process.env.JWT_SECRET;

/**
 * GET /
 * Main entry point for unauthenticated users.
 * Render index view with options login or register.
 */
route.get('/', (req, res) => {
    res.render('index');
});

/**
 * GET /login
 * Render login view for user to login and retrive a jwt token.
 */
route.get('/login', (req, res) => {
    res.render('login');
});

/**
 * POST /login
 * This route checks user input and returns a jwt token if user credentials is valid
 * and also uses a validation function that checks the format of the input.
 * 
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {string} req.body.userName - Username
 * @param {string} req.body.password - Users password
 * 
 * @return {object} 200 - JSON Web Token
 * @return {object} 400 - JSON message if wrong format
 * @return {object} 401 - JSON message if password or username are invalid
 * @return {object} 500 - JSON message internal error
 */
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
 * GET /register
 * Renders the register view for non existing users
 * to register and get a jwt token.
 */
route.get('/register', (req, res) => {
    res.render('register');
});

/**
 * POST /register
 * insert a new user into the database with a hashed password if valid and creates 
 * a jwt token for the new user.
 * 
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {string} req.body.userName - Username
 * @param {string} req.body.password - users password
 * 
 * @return {object} 404 - JSON error message invalid format
 * @return {object} 201 - JSON success message
 * @return {object} 500 - JSON error message Internal server error
 */
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

/**
 * GET /tasks
 * Retrives all tasks form database
 * 
 * @param {express.Response} res - Express reqsponse object
 * 
 * @return {object} 200 - JSON task objects
 * @return {object} 404 - JSON error message if tasks can't be found
 * @return {object} 500 - JSON error message internal server error 
 */
route.get('/tasks', async (req, res) => {
    const selectTasks = 'SELECT * FROM Tasks ORDER BY userId;';
    try{
        const [result] = await db.query(selectTasks);
        if(result.length === 0){
            res.status(404).json('No tasks available');
        }
        res.status(200).json(result);
    }catch(err){
        res.status(500).json('Internal error occured');
    }
});

/**
 * GET /tasks/:id
 * Retrives a specific task by its id
 * 
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {number} req.params.id - Task id
 * 
 * @return {object} 200 - JSON task object
 * @return {object} 404 - JSON message if task not found
 * @return {object} 500 - JSON message internal server error
 */
route.get('/tasks/:id', async (req, res) => {
    const taskId = req.params.id;
    const task = 'SELECT * FROM Tasks WHERE id = ?;';
    try{
        const [result] = await db.query(task, taskId);
        if(result.length === 0){
            res.status(404).json('No task with that ID');
        }
        res.status(200).json(...result);
    }catch(err){
        res.status(500).json('Internal error occured');
    }
});

 /**
  * POST /tasks
  * creates a new task and inserts it to database
  * 
  * @middleware authorization - Ensures user is authorized for the request
  * 
  * @param {express.Request} req - Express request object
  * @param {express.Response} res - Express response object
  * @param {string} req.body.title - Title of task
  * @param {string} req.body.description - Description of task
  * @param {string} req.body.status - Task status
  * @param {number} req.body.userId - Id of user related to task
  * 
  * @return {object} 201 - Task successfully created
  * @return {object} 400 - Error message malformed or missing data
  */
route.post('/tasks', authorization, async (req, res) => {
    const { title, description, status, userId } = req.body;
    try{
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

/**
 * PUT /tasks/:id
 * Makes updates to a task by using it id
 * 
 * @middleware authorization - Ensures user is authorized for request
 * 
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {number} req.params.taskid - Id of task
 * @param {string} req.body.title - Title of task
 * @param {string} req.body.description - Description of task
 * @param {string} req.body.status - Status of task
 * 
 * @return {object} 404 - Error message not found
 * @return {object} 403 - Error message not authorized
 * @return {object} 200 - Update successfull
 * @return {object} 500 - Error message internal error
 */
route.put('/tasks/:id', authorization, async (req, res) => {
    const taskId = req.params.id;
    const { title, description, status } = req.body;
    const updateTask = `UPDATE Tasks SET
                        title = ?,
                        description = ?,
                        status = ?
                        WHERE id = ?;`; 
    try{
        const checkTask = checkTasks(taskId, req.user.id, db);

        if(checkTask === "404"){
            return res.status(404).json({ message: "Task not found" });
        }

        if(checkTask === "403"){
            return res.status(403).json({ message: "Not authorized for this action" });
        }

        await db.query(updateTask, [title, description, status, taskId]);
        res.status(200).json({ message: `Update successfull!` });
    }catch(err){
        res.status(500).json({ message: `Internal error!`});
    }
});

/**
 * PATCH /tasks/:id
 * Updates all or individual columns in database depending
 * on request body.
 * Using COALESCE() to preserve values that are not passed
 * in request body.
 * 
 * @middleware authorization - Ensures user is authorized for request
 * 
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {number} req.params.taskId - Id of task
 * @param {string} req.body.title - Title of task
 * @param {string} req.body.description - Description of task
 * @param {string} req.body.status - Status of task
 * 
 * @return {object} 404 - Error message not found
 * @return {object} 403 - Error message not authorized
 * @return {object} 200 - Update successfull message
 * @return {object} 500 - Error message internal error
 */
route.patch('/tasks/:id', authorization, async (req, res) => {
    const taskId = req.params.id;
    let { title, description, status } = req.body;
    const updateTask = `UPDATE Tasks SET 
                        title = COALESCE(?, title),
                        description = COALESCE(?, description),
                        status = COALESCE(?, status)
                        WHERE id = ?;`;
    try{
        const checkTask = checkTasks(taskId, req.user.id, db);

        if(checkTask === "404"){
            return res.status(404).json({ message: "Task not found" });
        }

        if(checkTask === "403"){
            return res.status(403).json({ message: "Not authorized for this action" });
        }

        if(!title) title = null;
        if(!description) description = null;
        if(!status) status = null;

        await db.query(updateTask, [title, description, status, taskId]);

        res.status(200).json({ success: true, message: `Update successfull!` });
    }catch(err){
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /tasks/:id
 * Deletes a task using its id.
 * 
 * @middleware authorization - Ensures user is authorized for request
 * 
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {number} req.params.taskId - Id of task
 * 
 * @return {object} 404 - Error message not found
 * @return {object} 403 - Error message not authorized
 * @return {object} 204 - Deletion successfull message
 * @return {object} 500 - Error message internal error
 */
route.delete('/tasks/:id', authorization, async (req, res) => {
    const taskId = req.params.id;
    const userId = req.user.id;
    const deleteQuery = `DELETE FROM Tasks WHERE id = ? AND userId = ?;`;
    try{
        const checkTask = await checkTasks(taskId, userId, db);

        if(checkTask.error === "404"){
            return res.status(404).json({ message: "Task not found" });
        }

        if(checkTask.error === "403"){
            return res.status(403).json({ message: "Not authorized for this action" });
        }

        await db.query(deleteQuery, taskId, userId);
        res.status(204).json({ success: true, message: "Deletion successfull" });
    }catch(err){
        res.status(500).json({ error: err.message });
    }
});

/**
 * Helper method to retrieve a task and verify user ownership.
 * 
 * @param {number} taskId - Id of task
 * @param {number} userId - Id of user
 * @param {mysql.Connection} db - Active mySQL Database connection
 * 
 * @returns {object} 404 - Error code when task can't be found
 * @returns {object} 403 - Error code when user dont have ownership of task
 * @returns {object} task - A task object if found and user have ownership
 */
async function checkTasks(taskId, userId, db){
    const [select] = await db.query(`SELECT * FROM Tasks WHERE id = ?;`, [taskId]);
    const task = select[0];

    if(!task){
        return { error: "404" };
    }

    if(task.userId !== userId){
        return { error: "403" };
    }

    return { task };
}

export default route;