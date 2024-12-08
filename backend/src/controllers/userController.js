// src/controllers/userController.js
import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import PasswordUtils from '../utils/passwordUtils.js';

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
      const isMatch = await PasswordUtils.comparePassword(password, user.password);
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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' 
      });

      res.json({ 
        message: 'Login successful', 
        token 
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  }


  static async googleLogin(req, res) {
  // Destructure the necessary properties from the request body
  const { name, email, googlePhotoUrl } = req.body;

  try {
    // Find the user in the database by email
    const existingUser = await UserModel.findUserByEmail(email);

    // If user exists, sign them in
    if (existingUser) {
      // Generate a JWT token with user id
      const token = jwt.sign(
        { 
          id: existingUser.id, 
          email: existingUser.email,
          // Add any additional claims you want to include
        }, 
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Set secure cookie
      res.cookie('access_token', token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
      });

      // Prepare user response (exclude sensitive information)
      const { password, ...userResponse } = existingUser;

      return res.status(200).json({
        message: 'Google login successful',
        token,
        user: userResponse
      });
    } 
    
    // If user doesn't exist, create a new user
    
    // Generate a random password
    const generatePassword = () => {
      return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    };
    const randomPassword = generatePassword();
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Generate a unique username
    const generateUsername = (name) => {
      return name.toLowerCase().split(' ').join('') + 
             Math.random().toString(9).slice(-4);
    };
    const username = generateUsername(name);

    // Prepare user data for creation
    const userData = {
      user_name: username,
      email: email,
      password: hashedPassword,
      firebase_uid: uuidv4(), // Generate a unique identifier
      profile_picture: googlePhotoUrl,
      authentication_method: 'google'
    };

    // Create new user
    const createResult = await UserModel.createUser(
      userData.user_name, 
      userData.email, 
      userData.password,
      {
        firebase_uid: userData.firebase_uid,
        profile_picture: userData.profile_picture,
        authentication_method: userData.authentication_method
      }
    );

    // Retrieve the newly created user
    const newUser = await UserModel.findUserByEmail(email);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email,
        // Add any additional claims you want to include
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set secure cookie
    res.cookie('access_token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });

    // Prepare user response (exclude sensitive information)
    const { password, ...userResponse } = newUser;

    return res.status(200).json({
      message: 'Google user created successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Google authentication error:', error);
    
    // Differentiate between different types of errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        message: 'User with this email already exists',
        error: error.message 
      });
    }

    return res.status(500).json({ 
      message: 'Google authentication failed',
      error: error.message 
    });
  }
}

// Optional: Method to link Google account to existing account
static async linkGoogleAccount(req, res) {
  const { email, googlePhotoUrl, firebaseUid } = req.body;
  const userId = req.user.id; // From auth middleware

  try {
    // Update existing user with Google account details
    await UserModel.updateUserProfile(userId, {
      profile_picture: googlePhotoUrl,
      firebase_uid: firebaseUid,
      authentication_method: 'google'
    });

    return res.status(200).json({
      message: 'Google account linked successfully'
    });
  } catch (error) {
    console.error('Error linking Google account:', error);
    return res.status(500).json({
      message: 'Failed to link Google account',
      error: error.message
    });
  }

}
}


export default UserController;