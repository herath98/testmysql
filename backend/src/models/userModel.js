// src/models/userModel.js
import db from '../config/db.js';
import bcrypt from 'bcrypt';

class UserModel {
  // Create user with optional Google-specific fields
  static async createUser(user_name, email, hashedPassword, options = {}) {
    const {
      firebase_uid = null,
      profile_picture = null,
      authentication_method = 'local'
    } = options;

    const sql = `
      INSERT INTO login2 (
        user_name, 
        email, 
        password, 
        firebase_uid, 
        profile_picture, 
        authentication_method
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await db.query(sql, [
        user_name, 
        email, 
        hashedPassword, 
        firebase_uid, 
        profile_picture, 
        authentication_method
      ]);

      return result;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Find user by email with flexible return
  static async findUserByEmail(email) {
    try {
      const [rows] = await db.query("SELECT * FROM login2 WHERE email = ?", [email]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by Firebase UID
  static async findUserByFirebaseUid(firebase_uid) {
    try {
      const [rows] = await db.query("SELECT * FROM login2 WHERE firebase_uid = ?", [firebase_uid]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding user by Firebase UID:', error);
      throw error;
    }
  }

  // Compare password for local authentication
  static async comparePassword(inputPassword, storedPassword) {
    try {
      return await bcrypt.compare(inputPassword, storedPassword);
    } catch (error) {
      console.error('Password comparison error:', error);
      throw error;
    }
  }

  // Update user profile, useful for linking accounts or updating information
  static async updateUserProfile(userId, updateData) {
    const {
      user_name,
      profile_picture,
      firebase_uid,
      authentication_method
    } = updateData;

    const updateFields = [];
    const queryParams = [];

    // Dynamically build update query
    if (user_name) {
      updateFields.push("user_name = ?");
      queryParams.push(user_name);
    }

    if (profile_picture) {
      updateFields.push("profile_picture = ?");
      queryParams.push(profile_picture);
    }

    if (firebase_uid) {
      updateFields.push("firebase_uid = ?");
      queryParams.push(firebase_uid);
    }

    if (authentication_method) {
      updateFields.push("authentication_method = ?");
      queryParams.push(authentication_method);
    }

    if (updateFields.length === 0) {
      throw new Error('No update fields provided');
    }

    queryParams.push(userId);

    const sql = `
      UPDATE login2 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    try {
      const [result] = await db.query(sql, queryParams);
      return result;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(userId) {
    try {
      const [rows] = await db.query("SELECT * FROM login2 WHERE id = ?", [userId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }
}

export default UserModel;

// Database Migration SQL
/*
ALTER TABLE login2 
ADD COLUMN firebase_uid VARCHAR(255) NULL UNIQUE,
ADD COLUMN profile_picture VARCHAR(255) NULL,
ADD COLUMN authentication_method ENUM('local', 'google', 'facebook') DEFAULT 'local';
*/

// Example Usage in Controller
/*
try {
  // Creating a user with Google login
  const result = await UserModel.createUser(
    'John Doe', 
    'john@example.com', 
    hashedPassword, 
    {
      firebase_uid: 'google_unique_id',
      profile_picture: 'https://example.com/profile.jpg',
      authentication_method: 'google'
    }
  );

  // Updating a user's profile
  await UserModel.updateUserProfile(userId, {
    profile_picture: 'new_picture_url',
    firebase_uid: 'new_firebase_uid'
  });
} catch (error) {
  // Handle errors
}
*/

