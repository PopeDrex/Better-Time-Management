const jwt = require('jsonwebtoken');

class AuthController {
    constructor(userModel) {
        this.userModel = userModel;
    }

    async login(req, res) {
        const { username, password } = req.body;
        try {
            const user = await this.userModel.findUserByUsername(username);
            if (!user || !user.validatePassword(password)) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            // Generate JWT token
            const accessToken = jwt.sign(
                { 
                    "UserInfo": {
                        "username": user.username,
                        "roles": user.roles
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            );
            
            const refreshToken = jwt.sign(
                { "username": user.username },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            );
            
            // Save refreshToken with current user
            user.refreshToken = refreshToken;
            await this.userModel.updateUser(user);
            
            // Send tokens
            res.cookie('jwt', refreshToken, { 
                httpOnly: true, 
                sameSite: 'None',
                secure: true,
                maxAge: 24 * 60 * 60 * 1000 
            });
            
            res.status(200).json({ accessToken });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async register(req, res) {
        const { username, password } = req.body;
        try {
            const existingUser = await this.userModel.findUserByUsername(username);
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }
            const newUser = await this.userModel.createUser({ username, password });
            res.status(201).json({ message: 'User registered successfully', user: { username: newUser.username } });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
    
    async refresh(req, res) {
        const cookies = req.cookies;
        if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });
        
        const refreshToken = cookies.jwt;
        try {
            const user = await this.userModel.findUserByRefreshToken(refreshToken);
            if (!user) return res.status(403).json({ message: 'Forbidden' });
            
            // Evaluate jwt 
            jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET,
                (err, decoded) => {
                    if (err || user.username !== decoded.username) {
                        return res.status(403).json({ message: 'Forbidden' });
                    }
                    
                    const accessToken = jwt.sign(
                        {
                            "UserInfo": {
                                "username": user.username,
                                "roles": user.roles
                            }
                        },
                        process.env.ACCESS_TOKEN_SECRET,
                        { expiresIn: '15m' }
                    );
                    
                    res.json({ accessToken });
                }
            );
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
    
    async logout(req, res) {
        const cookies = req.cookies;
        if (!cookies?.jwt) return res.status(204).json({ message: 'No content' });
        
        const refreshToken = cookies.jwt;
        try {
            // Is refreshToken in db?
            const user = await this.userModel.findUserByRefreshToken(refreshToken);
            
            // Clear refreshToken in db
            if (user) {
                user.refreshToken = '';
                await this.userModel.updateUser(user);
            }
            
            // Clear cookie
            res.clearCookie('jwt', { 
                httpOnly: true, 
                sameSite: 'None', 
                secure: true 
            });
            
            res.status(204).json({ message: 'Logout successful' });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
}

module.exports = AuthController;