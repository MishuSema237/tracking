import { v4 as uuidv4 } from 'uuid';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // This should be hashed in a real application
  role: 'admin' | 'user' | 'manager';
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserInput {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'manager';
  permissions: string[];
}

const DEFAULT_ADMIN: Omit<User, 'id'> = {
  username: 'Admin',
  email: 'globaltrackteam@gmail.com',
  password: 'Glob@ltr@ckTe@m123', // This should be hashed in a real application
  role: 'admin',
  permissions: ['all'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const getAllUsers = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  const users = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as User[];
  
  // Add default admin if no users exist
  if (users.length === 0) {
    const adminRef = await addDoc(collection(db, 'users'), DEFAULT_ADMIN);
    return [{ id: adminRef.id, ...DEFAULT_ADMIN }];
  }
  
  return users;
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const users = await getAllUsers();
  return users.find(user => user.id === userId) || null;
};

export const createUser = async (userData: UserInput): Promise<User> => {
  const users = await getAllUsers();
  
  // Check if username or email already exists
  if (users.some(user => user.username === userData.username)) {
    throw new Error('Username already exists');
  }
  if (users.some(user => user.email === userData.email)) {
    throw new Error('Email already exists');
  }

  const now = new Date().toISOString();
  const newUser: Omit<User, 'id'> = {
    ...userData,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, 'users'), newUser);
  return { id: docRef.id, ...newUser };
};

export const updateUser = async (userId: string, userData: Partial<UserInput>): Promise<User> => {
  const users = await getAllUsers();
  const userIndex = users.findIndex(user => user.id === userId);

  if (userIndex === -1) {
    throw new Error('User not found');
  }

  // Check if username or email already exists for other users
  if (userData.username && users.some(user => user.username === userData.username && user.id !== userId)) {
    throw new Error('Username already exists');
  }
  if (userData.email && users.some(user => user.email === userData.email && user.id !== userId)) {
    throw new Error('Email already exists');
  }

  const updatedUser: Omit<User, 'id'> = {
    ...users[userIndex],
    ...userData,
    updatedAt: new Date().toISOString(),
  };

  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, updatedUser as any); // Type assertion needed due to Firestore types

  return { id: userId, ...updatedUser };
};

export const deleteUser = async (userId: string): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('User not found');
  
  await deleteDoc(docRef);
};

export const validateUser = async (email: string, password: string): Promise<User | null> => {
  const users = await getAllUsers();
  // In a real application, you would hash the password and compare hashes
  // This is just for demonstration purposes
  const user = users.find(user => user.email === email && user.password === password);
  if (!user) return null;
  
  // Don't send password to client
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
};

// Update user permissions
export const updateUserPermissions = async (userId: string, permissions: string[]): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('User not found');
  
  await updateDoc(docRef, {
    permissions,
    updatedAt: new Date().toISOString()
  });
}; 
