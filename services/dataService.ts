import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    orderBy,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Contact, Interaction, LogEntry, Tag } from "../types";

export const CONTACTS_COLLECTION = 'contacts';
export const INTERACTIONS_COLLECTION = 'interactions';
export const LOGS_COLLECTION = 'logs';
export const TAGS_COLLECTION = 'tags';

// --- Contacts ---

export const subscribeToContacts = (userId: string, callback: (contacts: Contact[]) => void) => {
    const q = query(
        collection(db, `users/${userId}/${CONTACTS_COLLECTION}`),
        orderBy('name', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const contacts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Contact));
        callback(contacts);
    });
};

export const addContact = async (userId: string, contact: Omit<Contact, 'id'>) => {
    return addDoc(collection(db, `users/${userId}/${CONTACTS_COLLECTION}`), {
        ...contact,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

export const updateContact = async (userId: string, contactId: string, data: Partial<Contact>) => {
    const docRef = doc(db, `users/${userId}/${CONTACTS_COLLECTION}`, contactId);
    return updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
};

export const deleteContact = async (userId: string, contactId: string) => {
    return deleteDoc(doc(db, `users/${userId}/${CONTACTS_COLLECTION}`, contactId));
};

// --- Tags / Definitions ---

export const subscribeToTags = (userId: string, callback: (tags: Tag[]) => void) => {
    const q = query(
        collection(db, `users/${userId}/${TAGS_COLLECTION}`),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const tags = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Tag));
        callback(tags);
    });
};

export const addTag = async (userId: string, tag: Omit<Tag, 'id'>) => {
    return addDoc(collection(db, `users/${userId}/${TAGS_COLLECTION}`), {
        ...tag,
        createdAt: serverTimestamp()
    });
};

export const deleteTag = async (userId: string, tagId: string) => {
    return deleteDoc(doc(db, `users/${userId}/${TAGS_COLLECTION}`, tagId));
};

// --- Logs / History ---

export const subscribeToLogs = (userId: string, callback: (logs: LogEntry[]) => void) => {
    const q = query(
        collection(db, `users/${userId}/${LOGS_COLLECTION}`),
        orderBy('timestamp', 'desc') // Assuming we store a real timestamp object or ISO string that sorts correctly
    );

    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as LogEntry));
        callback(logs);
    });
};

export const addLog = async (userId: string, log: Omit<LogEntry, 'id'>) => {
    return addDoc(collection(db, `users/${userId}/${LOGS_COLLECTION}`), {
        ...log,
        // Overwrite the simple string timestamp with server time for sorting, 
        // but we might want to keep the display string too.
        // For now, let's just store what passes in, but add a sorting field.
        createdAt: serverTimestamp()
    });
};
