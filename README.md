# Lab2 project Task manager. 

A task manager project 

sets up a database in mysql with tables user and tasks.

I have set up a way to register by either use the form in the browser or direct by using postman or curl to recieve a JWT token to be able to make other requests towards the database.
When register a new user the password will be saved hashed and not in plain text.

there are also 2 ways to log in just as the register way where the endpoint will check the users password hash and then send back an JWT token if authorized.

I have tried to make a patch route where the user can choose witch information of a task they want to change otherwise the old values stays. 