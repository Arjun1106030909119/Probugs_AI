const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        // Check for extension bypass
        const source = req.headers['x-extension-source'];
        console.log(`[Extension Auth] Request Headers: ${JSON.stringify(req.headers)}`);
        
        if (source === 'probugs-extension') {
            console.log('[Extension Auth] Bypass identifier matched. Mocking user.');
            req.user = { 
                _id: '000000000000000000000000', // Mock Object ID
                id: '000000000000000000000000',
                name: 'Extension Guest',
                role: 'user'
            };
            return next();
        }
        
        return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        if (!req.user) {
             return res.status(401).json({ success: false, error: 'User not found' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};
