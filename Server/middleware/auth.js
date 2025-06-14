const jwt = require('jsonwebtoken');
const User = require('../models/User');
//this will make sure that the user is authenticated
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized access, PLS login man!!' });
    }
};

module.exports = auth; 
