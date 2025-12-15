import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

export const uploadFile = async (
  file: File,
  path: string
): Promise<string> => {
  if (!storage) throw new Error('Firebase Storage não está inicializado');
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};

export const deleteFile = async (path: string): Promise<void> => {
  if (!storage) throw new Error('Firebase Storage não está inicializado');
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

export const getFileUrl = async (path: string): Promise<string> => {
  if (!storage) throw new Error('Firebase Storage não está inicializado');
  const storageRef = ref(storage, path);
  return await getDownloadURL(storageRef);
};

