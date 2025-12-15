import Joi from 'joi';
import jwt from 'jsonwebtoken';

export function validInput(body) {
  const validationSchema = Joi.object({
    userName: Joi.string().required(),
    password: Joi.string().min(6).required()
  });

  return validationSchema.validate(body);
}

export function authorization(req, res, next) {
    const auth = req.headers['authorization'];
    if(!auth){
        return res.status(401).json({ error: 'Error creating Token' });
    }

    const generatedToken = auth.split(' ')[1];
    try{
        const decode = jwt.verify(generatedToken, process.env.JWT_SECRET);
        req.user = decode;
        next();
    }catch(err){
        return res.status(403).json({ error: 'Token not valid' });
    }
}