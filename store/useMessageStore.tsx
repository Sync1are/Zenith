import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db } from "../config/firebase";

import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    onSnapshot,
    orderBy,
    doc,
    setDoc,
    increment,
    deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

export interface User {
    id: string;
    username: string;
    avatar?: string;
    status: "online" | "offline" | "busy";
    lastActive?: number;
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

interface MessageState {
    users: User[];
    messages: Record<string, Message[]>; // partnerId -> messages
    notifications: Record<string, number>; // senderId -> unread count
    activeUserId: string | null;
    currentUser: User | null;

    // actions
    login: (username: string) => Promise<void>;
    setActiveUser: (userId: string | null) => void;
    sendMessage: (receiverId: string, text: string) => Promise<void>;
    subscribeToUsers: () => () => void;
    subscribeToMessages: (partnerId: string) => () => void;
    subscribeToNotifications: () => () => void;
    markAsRead: (senderId: string) => Promise<void>;
    logout: () => Promise<void>;
    uploadAvatar: (file: File) => Promise<string>;
}

export const useMessageStore = create<MessageState>()(
    persist(
        (set, get) => ({
            users: [],
            messages: {},
            notifications: {},
            activeUserId: null,
            currentUser: null,

            // ---------------------------------------------------
            // LOGIN
            // ---------------------------------------------------
            login: async (username: string) => {
                // Find existing user
                const q = query(collection(db, "users"), where("username", "==", username));
                const snap = await getDocs(q);
                let userId = "";
                if (snap.empty) {
                    const newUser = await addDoc(collection(db, "users"), {
                        username,
                        status: "online",
                        lastActive: Date.now(),
                    });
                    userId = newUser.id;
                } else {
                    userId = snap.docs[0].id;
                }
                // Ensure user document has required fields
                await setDoc(
                    doc(db, "users", userId),
                    { username, status: "online", lastActive: Date.now() },
                    { merge: true }
                );
                // Update local state
                set({
                    currentUser: { id: userId, username, status: "online", lastActive: Date.now() },
                });
            },

            // ---------------------------------------------------
            // SET ACTIVE CHAT PARTNER
            // ---------------------------------------------------
            setActiveUser: (userId) => {
                set({ activeUserId: userId });
                if (userId) {
                    // When opening a chat, clear unread count for that user
                    get().markAsRead(userId);
                }
            },

            // ---------------------------------------------------
            // MARK NOTIFICATIONS AS READ
            // ---------------------------------------------------
            markAsRead: async (senderId) => {
                const { currentUser } = get();
                if (!currentUser) return;
                // Optimistically clear locally
                const newNotifs = { ...get().notifications };
                delete newNotifs[senderId];
                set({ notifications: newNotifs });
                // Reset count in Firestore (set to 0)
                try {
                    await setDoc(
                        doc(db, "users", currentUser.id, "notifications", senderId),
                        { count: 0 },
                        { merge: true }
                    );
                } catch (e) {
                    console.error("Failed to reset notification count", e);
                }
            },

            // ---------------------------------------------------
            // SEND MESSAGE
            // ---------------------------------------------------
            sendMessage: async (receiverId, text) => {
                const { currentUser } = get();
                if (!currentUser) return;
                const chatId = [currentUser.id, receiverId].sort().join("_");
                const msgRef = collection(db, "chats", chatId, "messages");
                await addDoc(msgRef, {
                    senderId: currentUser.id,
                    text,
                    timestamp: Date.now(),
                });
                // Update last active timestamps
                await setDoc(
                    doc(db, "users", currentUser.id),
                    { lastActive: Date.now(), status: "online" },
                    { merge: true }
                );
                await setDoc(
                    doc(db, "users", receiverId),
                    { lastActive: Date.now() },
                    { merge: true }
                );
                // Increment receiver's notification counter
                await setDoc(
                    doc(db, "users", receiverId, "notifications", currentUser.id),
                    { count: increment(1) },
                    { merge: true }
                );
            },

            // ---------------------------------------------------
            // SUBSCRIBE TO USERS LIST
            // ---------------------------------------------------
            subscribeToUsers: () => {
                const q = query(collection(db, "users"), orderBy("lastActive", "desc"));
                const unsub = onSnapshot(q, (snap) => {
                    const list: User[] = [];
                    snap.forEach((docSnap) => {
                        if (docSnap.id !== get().currentUser?.id) {
                            list.push({ ...(docSnap.data() as User), id: docSnap.id });
                        }
                    });
                    set({ users: list });
                });
                return unsub;
            },

            // ---------------------------------------------------
            // SUBSCRIBE TO NOTIFICATIONS
            // ---------------------------------------------------
            subscribeToNotifications: () => {
                const { currentUser } = get();
                if (!currentUser) return () => { };
                const q = collection(db, "users", currentUser.id, "notifications");
                const unsub = onSnapshot(q, (snap) => {
                    const notifs: Record<string, number> = {};
                    snap.forEach((docSnap) => {
                        const data = docSnap.data();
                        if (data && typeof data.count === "number") {
                            notifs[docSnap.id] = data.count;
                        }
                    });
                    set({ notifications: notifs });
                });
                return unsub;
            },

            // ---------------------------------------------------
            // SUBSCRIBE TO MESSAGES WITH A PARTNER
            // ---------------------------------------------------
            subscribeToMessages: (partnerId) => {
                const { currentUser } = get();
                if (!currentUser) return () => { };
                const chatId = [currentUser.id, partnerId].sort().join("_");
                const q = query(
                    collection(db, "chats", chatId, "messages"),
                    orderBy("timestamp", "asc")
                );
                const unsub = onSnapshot(q, (snap) => {
                    const msgs: Message[] = [];
                    snap.forEach((docSnap) => {
                        msgs.push({ ...(docSnap.data() as Message), id: docSnap.id });
                    });
                    set((state) => ({
                        messages: { ...state.messages, [partnerId]: msgs },
                    }));
                });
                return unsub;
            },

            // ---------------------------------------------------
            // LOGOUT
            // ---------------------------------------------------
            logout: async () => {
                const { currentUser } = get();
                if (currentUser) {
                    await setDoc(
                        doc(db, "users", currentUser.id),
                        { status: "offline", lastActive: Date.now() },
                        { merge: true }
                    );
                }
                set({
                    currentUser: null,
                    activeUserId: null,
                    messages: {},
                    notifications: {},
                });
            },

            // ---------------------------------------------------
            // UPLOAD AVATAR (Base64 workaround for CORS)
            // ---------------------------------------------------
            uploadAvatar: async (file: File) => {
                const { currentUser } = get();
                if (!currentUser) throw new Error("No user logged in");

                // Helper to compress and convert to base64
                const compressImage = (file: File): Promise<string> => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = (event) => {
                            const img = new Image();
                            img.src = event.target?.result as string;
                            img.onload = () => {
                                const canvas = document.createElement("canvas");
                                const MAX_WIDTH = 256;
                                const MAX_HEIGHT = 256;
                                let width = img.width;
                                let height = img.height;

                                if (width > height) {
                                    if (width > MAX_WIDTH) {
                                        height *= MAX_WIDTH / width;
                                        width = MAX_WIDTH;
                                    }
                                } else {
                                    if (height > MAX_HEIGHT) {
                                        width *= MAX_HEIGHT / height;
                                        height = MAX_HEIGHT;
                                    }
                                }

                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext("2d");
                                ctx?.drawImage(img, 0, 0, width, height);
                                resolve(canvas.toDataURL("image/jpeg", 0.7)); // Compress to JPEG 70%
                            };
                            img.onerror = (err) => reject(err);
                        };
                        reader.onerror = (err) => reject(err);
                    });
                };

                try {
                    const base64Image = await compressImage(file);

                    // Update Firestore with base64 string
                    await setDoc(
                        doc(db, "users", currentUser.id),
                        { avatar: base64Image },
                        { merge: true }
                    );

                    // Update local state
                    set((state) => ({
                        currentUser: state.currentUser
                            ? { ...state.currentUser, avatar: base64Image }
                            : null,
                    }));

                    return base64Image;
                } catch (error) {
                    console.error("Error processing image:", error);
                    throw new Error("Failed to process image");
                }
            },
        }),
        {
            name: "zenith-messaging-storage",
            partialize: (state) => ({ currentUser: state.currentUser }),
        }
    )
);
