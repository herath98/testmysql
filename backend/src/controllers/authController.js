// src/controllers/authController.js
import jwt from 'jsonwebtoken';
import { admin } from '../config/firebaseConfig.js';
import UserModel from '../models/userModel.js';

class AuthController {
  // Existing local registration and login methods...

  static async googleLogin(req, res) {
    try {
      // Get the ID token from the request body
      const { idToken } = req.body;

      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Extract user information from the decoded token
      const {
        email,
        name: user_name,
        picture: profile_picture,
        sub: firebase_uid
      } = decodedToken;

      // Check if user already exists in your database
      let user = await UserModel.findUserByEmail(email);

      if (!user) {
        // Create a new user if they don't exist
        const hashedPassword = await PasswordUtils.hashPassword(
          // Generate a random password for Google-authenticated users
          crypto.randomBytes(16).toString('hex')
        );

        const [result] = await UserModel.createUser(
          user_name, 
          email, 
          hashedPassword, 
          {
            firebase_uid,
            profile_picture,
            authentication_method: 'google'
          }
        );

        // Fetch the newly created user
        user = await UserModel.findUserByEmail(email);
      }

      // Generate JWT for your application
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          provider: 'google'
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );

      // Set cookie and send response
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.json({ 
        message: 'Google login successful', 
        token,
        user: {
          id: user.id,
          name: user.user_name,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Google login error:', error);
      res.status(500).json({ 
        message: 'Google login failed', 
        error: error.message 
      });
    }
  }
}

export default AuthController;