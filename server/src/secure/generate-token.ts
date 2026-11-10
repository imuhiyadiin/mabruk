import jwt from "jsonwebtoken";

export interface UserData {
  id: string;
  email: string;
  role: string;
}

export const generateToken = (user: UserData) => {
  return jwt.sign(user, process.env.SECRET_KEY!, { expiresIn: "1d" });
};