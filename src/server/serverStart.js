/**
 * this file starts upp the express server and also handles
 * termination of server connection
 */

import app from './middleware.js';
import db from '../database/connect.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, (err) => {
    if(err) throw err;
    console.log(`Server listens to port: ${PORT}`);
})

/**
 * function to make a gracefull shutdown of server connection
 * where database connection gets closed before exit.
 */
function shutdown(){
    console.log("Terminating server process");
    server.close(async () => {
        try{
            await db.end();
            console.log("Database connection closed!");
        }catch(err){
            console.error("Error closing database connection!", err);
        }
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);