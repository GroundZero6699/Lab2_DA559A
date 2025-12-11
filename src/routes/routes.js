import db from '../database/connect.js';
import express from 'express';
import { validInput, authorization } from '../validate/validationSchema.js';

const route = express.Router();

route.get('/tasks', async (req, res) => {
    const selectTasks = 'SELECT * FROM Tasks';
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
    const { taskId } = req.query.id;
    const task = 'SELECT * FROM Tasks WHERE id = ?';
    try{
        const { result } = await db.query(task, taskId);
        if(result === 0){
            res.status(404).json('No task with that ID');
        }
        res.status(200).json(result);
    }catch(err){
        res.status(500).json('Internal error occured');
    }
});

/*route.post('/tasks', auth, async (req, res) => {
    try{
        const valid = validInput(req.body);
        
        const newTask = `INSERT INTO Task (title, description, status, userId)
                     VALUES (?, ?, ?, ?);`;
        await db.query(newTask, [valid.title, valid.description, valid.status, req.user.userId]);
        res.status(201).json({ 
            success: true, 
            message: 'New task successfull created' });
    }catch(err){
        res.status(400).json({ 
            error: err.message,
            message: `Invalid request body, malformed or missing data` });
    }
});*/

export default route;