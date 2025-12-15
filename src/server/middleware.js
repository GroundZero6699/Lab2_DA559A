import express from 'express';
import routes from '../routes/routes.js';
import path from 'path';

const app = express();

app.use(express.json());
app.use(express.static('src/public'));
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join('src', 'views'));
app.set('view engine', 'ejs');
app.use('/api', routes);

export default app;