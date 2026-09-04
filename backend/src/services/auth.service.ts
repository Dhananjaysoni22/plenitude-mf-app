
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '../dal/user.dal';
import { AppError } from '../utils/AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'plenitude_super_secret_key_2026';

export const loginUser = async (email: string, passwordRaw: string) => {
  const user = await findUserByEmail(email);
  if (!user) throw new AppError('Invalid credentials', 401);

  let valid = false;
  if (user.passwordHash === 'defaultpassword' && passwordRaw === 'defaultpassword') {
    valid = true;
  } else {
    valid = await bcrypt.compare(passwordRaw, user.passwordHash);
  }

  if (!valid) throw new AppError('Invalid credentials', 401);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { token, user: { id: user.id, name: user.name, role: user.role, email: user.email } };
};
