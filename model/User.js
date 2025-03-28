const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

class User {
    constructor() {
        this.usersFile = path.join(__dirname, 'users.json');
    }

    async getUsers() {
        try {
            const data = await fs.readFile(this.usersFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading users file:', error);
            return [];
        }
    }

    async saveUsers(users) {
        try {
            await fs.writeFile(this.usersFile, JSON.stringify(users, null, 2));
            return true;
        } catch (error) {
            console.error('Error writing users file:', error);
            return false;
        }
    }

    async findUserByUsername(username) {
        const users = await this.getUsers();
        const user = users.find(user => user.username === username);
        if (user) {
            // Add validatePassword method to user object
            user.validatePassword = (password) => {
                return bcrypt.compareSync(password, user.password);
            };
        }
        return user;
    }

    async findUserByRefreshToken(refreshToken) {
        const users = await this.getUsers();
        const user = users.find(user => user.refreshToken === refreshToken);
        if (user) {
            // Add validatePassword method to user object
            user.validatePassword = (password) => {
                return bcrypt.compareSync(password, user.password);
            };
        }
        return user;
    }

    async updateUser(userData) {
        const users = await this.getUsers();
        const index = users.findIndex(user => user.username === userData.username);
        
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
            await this.saveUsers(users);
            return true;
        }
        
        return false;
    }

    async createUser(userData) {
        const { username, password } = userData;
        const users = await this.getUsers();
        
        // Check if user already exists
        if (users.some(user => user.username === username)) {
            throw new Error('Username already exists');
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user with default role
        const newUser = {
            username,
            password: hashedPassword,
            roles: {
                "user": 1111
            },
            refreshToken: ''
        };
        
        users.push(newUser);
        await this.saveUsers(users);
        
        return { ...newUser, password: undefined };
    }
}

module.exports = new User();