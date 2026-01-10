import Joi from 'joi';
import jwt from 'jsonwebtoken';

/**
 * Validates user input from request body.
 * 
 * @param {object} body - Express request body object
 * @param {string} body.userName - username (required)
 * @param {string} body.password - password, minimum 6 char (required)
 *  
 * @returns {object} Joi validation result
 */
export function validInput(body) {
  const validationSchema = Joi.object({
    userName: Joi.string().required(),
    password: Joi.string().min(6).required()
  });

  return validationSchema.validate(body);
}

/**
 * Middleware to validate JWT tokens.
 * With specified hashing algorithm to avoid header spoofing.
 * 
 * @param {Express.Request} req - Express request object
 * @param {Express.Response} res - Express response object
 * @param {Express.NextFunction} next - Express next middleware function
 * @returns {void} - Responds with 401 if there is no token, 
 * 403 if token is invalid else attaches decoded payload to req.user and call next().
 */
export function authorization(req, res, next) {
    const auth = req.headers['authorization'];
    if(!auth){
        return res.status(401).json({ error: 'Not authorized!' });
    }

    const generatedToken = auth.split(' ')[1];
    try{
        const decode = jwt.verify(generatedToken, process.env.JWT_SECRET, { algorithms: ['RS256'] });
        req.user = decode;
        next();
    }catch(err){
        return res.status(403).json({ error: 'Token not valid' });
    }
}