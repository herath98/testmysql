// src/controllers/userController.js
import UserModel from '../models/userModel.js';
import  PasswordUtils from '../utils/passwordUtils.js';

class UserController {
  static async register(req, res) {
    try {
      const { user_name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }

      // Hash password
      const hashedPassword = await PasswordUtils.hashPassword(password);

      // Create user
      const [result] = await UserModel.createUser(user_name, email, hashedPassword);

      res.status(201).json({ 
        message: "User registered successfully", 
        userId: result.insertId 
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await UserModel.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Compare passwords
      const isMatch = await UserModel.comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );

      res.cookie('token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production' 
      });

      res.json({ 
        message: 'Login successful', 
        token 
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  }
}

export default UserController;