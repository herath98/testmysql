// src/utils/passwordUtils.js
import bcrypt from 'bcrypt';

class PasswordUtils {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

export default PasswordUtils;