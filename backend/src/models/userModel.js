// src/models/userModel.js
import db  from '../config/db.js'; // Make sure this path is correct

class UserModel {
  static async createUser(user_name, email, hashedPassword) {
    const sql = "INSERT INTO login2 (user_name, email, password) VALUES (?, ?, ?)";
    return await db.query(sql, [user_name, email, hashedPassword]);
  }

  static async findUserByEmail(email) {
    const [rows] = await db.query("SELECT * FROM login2 WHERE email = ?", [email]);
    return rows[0];
  }
  static async comparePassword(inputPassword, storedPassword) {
    return await bcrypt.compare(inputPassword, storedPassword);
  }
}

export default  UserModel;