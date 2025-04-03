
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { firestore } from './index';

// Helper function to convert Firestore timestamp to Date
export const timestampToDate = (timestamp: any): Date | undefined => {
  return timestamp ? timestamp.toDate() : undefined;
};

// Helper function to set document with ID
export const firestoreSetDoc = (docRef: any, data: any) => {
  return updateDoc(docRef, data).catch(() => {
    // If update fails (document doesn't exist), create it
    return setDoc(docRef, data);
  });
};
