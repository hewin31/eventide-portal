import { Request, Response } from 'express';

// Define the shape of a User object. This provides type safety and autocompletion.
interface User {
  id: number;
  username: string;
  email: string;
  password: string; // In a real app, this would be the hashed password
}

// Our mock user store is now strongly-typed to only accept User objects.
const users: User[] = [];

export const handleRegister = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  try {
    // --- DATABASE LOGIC ---
    // 1. Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // 2. In a real app, hash the password:
    // const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save the new user to the database
    const newUser: User = { id: users.length + 1, username, email, password /*: hashedPassword */ };
    users.push(newUser);
    console.log('Registered new user:', newUser);

    // --- RESPONSE ---
    res.status(201).json({ message: 'User created successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

export const handleLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // --- DATABASE LOGIC ---
    // 1. Find the user by email
    // Because `users` is a User[], `user` is now correctly typed as `User | undefined`.
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 2. In a real app, compare the hashed password:
    // const isMatch = await bcrypt.compare(password, user.password);
    const isMatch = user.password === password; // Mock comparison for now
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // --- TOKEN GENERATION & RESPONSE ---
    const token = `mock-jwt-for-user-${user.id}`; // In a real app, create a real JWT
    const userResponse = { email: user.email, username: user.username };

    res.status(200).json({ user: userResponse, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
};