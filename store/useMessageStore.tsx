// src/store/useMessageStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db, auth } from "../config/firebase";

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
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    writeBatch,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    GoogleAuthProvider,
    signInWithPopup,
    User as FirebaseUser,
    updateProfile,
} from "firebase/auth";

// If you later want to store images in Storage instead of base64 in Firestore,
// uncomment these lines and update uploadAvatar accordingly.
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { storage } from "../config/firebase";

export interface User {
    id: string;
    username: string;
    email?: string;
    avatar?: string;
    status: "online" | "offline" | "busy";
    lastActive?: number;
    friendRequests?: string[];
    friends?: string[];
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    // Keeping number for UI sorting, but we store serverTimestamp in Firestore too.
    timestamp: number;
}

interface MessageState {
    users: User[];
    messages: Record<string, Message[]>;
    notifications: Record<string, number>;
    activeUserId: string | null;
    currentUser: User | null;
    isLoading: boolean;

    // actions
    signup: (email: string, pass: string, username: string) => Promise<void>;
    login: (email: string, pass: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    initAuth: () => () => void;

    setActiveUser: (userId: string | null) => void;

    sendFriendRequest: (username: string) => Promise<void>;
    acceptFriendRequest: (senderId: string) => Promise<void>;
    rejectFriendRequest: (senderId: string) => Promise<void>;

    sendMessage: (receiverId: string, text: string) => Promise<void>;
    subscribeToUsers: () => () => void;
    subscribeToMessages: (partnerId: string) => () => void;
    subscribeToNotifications: () => () => void;
    markAsRead: (senderId: string) => Promise<void>;
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
            isLoading: true,

            // INIT AUTH LISTENER
            initAuth: () => {
                const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
                    try {
                        if (firebaseUser) {
                            // If email not verified (for email/password), hold off
                            if (!firebaseUser.emailVerified && !firebaseUser.providerData.some(p => p.providerId === "google.com")) {
                                set({ currentUser: null, isLoading: false });
                                return;
                            }

                            // Ensure a Firestore user doc exists
                            const uref = doc(db, "users", firebaseUser.uid);
                            const snap = await getDoc(uref);

                            if (snap.exists()) {
                                const userData = snap.data() as Omit<User, "id">;
                                // Normalize guaranteed fields
                                const current: User = {
                                    id: firebaseUser.uid,
                                    username: userData.username || firebaseUser.displayName || "User",
                                    email: userData.email || firebaseUser.email || undefined,
                                    avatar:
                                        userData.avatar ||
                                        firebaseUser.photoURL ||
                                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                                    status: "online",
                                    lastActive: Date.now(),
                                    friends: userData.friends || [],
                                    friendRequests: userData.friendRequests || [],
                                };

                                set({ currentUser: current, isLoading: false });

                                // Update status/lastActive
                                await setDoc(
                                    uref,
                                    {
                                        status: "online",
                                        lastActive: Date.now(),
                                    },
                                    { merge: true }
                                );
                            } else {
                                // Create first-time doc
                                const newUser: User = {
                                    id: firebaseUser.uid,
                                    username: firebaseUser.displayName || "User",
                                    email: firebaseUser.email || undefined,
                                    avatar:
                                        firebaseUser.photoURL ||
                                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                                    status: "online",
                                    lastActive: Date.now(),
                                    friends: [],
                                    friendRequests: [],
                                };

                                await setDoc(uref, {
                                    username: newUser.username,
                                    email: newUser.email,
                                    avatar: newUser.avatar,
                                    status: newUser.status,
                                    lastActive: newUser.lastActive,
                                    friends: newUser.friends,
                                    friendRequests: newUser.friendRequests,
                                });

                                set({ currentUser: newUser, isLoading: false });
                            }
                        } else {
                            set({ currentUser: null, isLoading: false });
                        }
                    } catch {
                        set({ currentUser: null, isLoading: false });
                    }
                });
                return unsub;
            },

            // SIGNUP
            signup: async (email, password, username) => {
                console.log("🔵 Starting signup for:", email);

                // Check if username already exists
                console.log("🔍 Checking username availability:", username);
                const usernameQuery = query(
                    collection(db, "users"),
                    where("username", "==", username)
                );
                const usernameSnap = await getDocs(usernameQuery);

                if (!usernameSnap.empty) {
                    console.error("❌ Username already taken:", username);
                    throw new Error("Username already taken. Please choose a different one.");
                }
                console.log("✅ Username is available");

                const cred = await createUserWithEmailAndPassword(auth, email, password);
                const u = cred.user;
                console.log("✅ User created in Firebase Auth:", u.uid);

                // Set displayName to keep consistency
                await updateProfile(u, { displayName: username });
                console.log("✅ Display name updated:", username);

                // Send verification
                console.log("📧 Attempting to send verification email to:", u.email);
                try {
                    await sendEmailVerification(u);
                    console.log("✅ Verification email sent successfully");
                } catch (emailError: any) {
                    console.error("❌ Failed to send verification email:", emailError);
                    console.error("Error code:", emailError.code);
                    console.error("Error message:", emailError.message);
                    throw new Error(`Email verification failed: ${emailError.message}`);
                }

                // Create Firestore user doc (status offline until login)
                await setDoc(doc(db, "users", u.uid), {
                    username,
                    email,
                    status: "offline",
                    lastActive: Date.now(),
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                        username
                    )}`,
                    friends: [],
                    friendRequests: [],
                });
                console.log("✅ Firestore user document created");

                // Sign out until email verified
                await signOut(auth);
                console.log("✅ User signed out - awaiting email verification");
            },

            // LOGIN
            login: async (email, password) => {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                const u = cred.user;

                if (!u.emailVerified) {
                    await signOut(auth);
                    throw new Error("Please verify your email address before logging in.");
                }
                // State changes handled by onAuthStateChanged
            },

            // LOGIN WITH GOOGLE
            loginWithGoogle: async () => {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                const u = result.user;

                const uref = doc(db, "users", u.uid);
                const snap = await getDoc(uref);

                if (!snap.exists()) {
                    await setDoc(uref, {
                        username: u.displayName || "User",
                        email: u.email,
                        avatar: u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`,
                        status: "online",
                        lastActive: Date.now(),
                        friends: [],
                        friendRequests: [],
                    });
                } else {
                    await setDoc(
                        uref,
                        { status: "online", lastActive: Date.now() },
                        { merge: true }
                    );
                }
            },

            // LOGOUT
            logout: async () => {
                const { currentUser } = get();
                if (currentUser) {
                    await setDoc(
                        doc(db, "users", currentUser.id),
                        { status: "offline", lastActive: Date.now() },
                        { merge: true }
                    );
                }
                await signOut(auth);
                set({
                    currentUser: null,
                    activeUserId: null,
                    messages: {},
                    notifications: {},
                });
            },

            // SET ACTIVE CHAT PARTNER
            setActiveUser: (userId) => {
                set({ activeUserId: userId });
                if (userId) {
                    get().markAsRead(userId);
                }
            },

            // FRIEND REQUESTS
            sendFriendRequest: async (username: string) => {
                const { currentUser } = get();
                if (!currentUser) throw new Error("Not logged in");

                // Find target by username
                const q = query(collection(db, "users"), where("username", "==", username));
                const snap = await getDocs(q);

                if (snap.empty) {
                    throw new Error("User not found");
                }

                const targetDoc = snap.docs[0];
                const targetUserId = targetDoc.id;

                if (targetUserId === currentUser.id) {
                    throw new Error("Cannot add yourself");
                }

                const targetUserData = targetDoc.data() as User;

                if (targetUserData.friends?.includes(currentUser.id)) {
                    throw new Error("Already friends");
                }
                if (targetUserData.friendRequests?.includes(currentUser.id)) {
                    throw new Error("Request already sent");
                }

                await updateDoc(doc(db, "users", targetUserId), {
                    friendRequests: arrayUnion(currentUser.id),
                });
            },

            acceptFriendRequest: async (senderId: string) => {
                const { currentUser } = get();
                if (!currentUser) return;

                // Use batch so both updates commit atomically
                const batch = writeBatch(db);
                const meRef = doc(db, "users", currentUser.id);
                const senderRef = doc(db, "users", senderId);

                batch.update(meRef, {
                    friends: arrayUnion(senderId),
                    friendRequests: arrayRemove(senderId),
                });
                batch.update(senderRef, { friends: arrayUnion(currentUser.id) });

                await batch.commit();

                // Optimistic local state
                set((state) => ({
                    currentUser: state.currentUser
                        ? {
                            ...state.currentUser,
                            friends: [...(state.currentUser.friends || []), senderId],
                            friendRequests: (state.currentUser.friendRequests || []).filter(
                                (id) => id !== senderId
                            ),
                        }
                        : null,
                }));
            },

            rejectFriendRequest: async (senderId: string) => {
                const { currentUser } = get();
                if (!currentUser) return;

                await updateDoc(doc(db, "users", currentUser.id), {
                    friendRequests: arrayRemove(senderId),
                });

                set((state) => ({
                    currentUser: state.currentUser
                        ? {
                            ...state.currentUser,
                            friendRequests: (state.currentUser.friendRequests || []).filter(
                                (id) => id !== senderId
                            ),
                        }
                        : null,
                }));
            },

            // MARK NOTIFICATIONS AS READ
            markAsRead: async (senderId) => {
                const { currentUser } = get();
                if (!currentUser) return;

                const newNotifs = { ...get().notifications };
                delete newNotifs[senderId];
                set({ notifications: newNotifs });

                try {
                    await setDoc(
                        doc(db, "users", currentUser.id, "notifications", senderId),
                        { count: 0 },
                        { merge: true }
                    );
                } catch {
                    // no-op
                }
            },

            // SEND MESSAGE
            sendMessage: async (receiverId, text) => {
                const { currentUser } = get();
                if (!currentUser) return;

                const trimmed = text.trim();
                if (!trimmed) return;

                const chatId = [currentUser.id, receiverId].sort().join("_");
                const msgRef = collection(db, "chats", chatId, "messages");

                // We store both serverTimestamp and a client timestamp for UI ordering fallbacks
                await addDoc(msgRef, {
                    senderId: currentUser.id,
                    text: trimmed,
                    createdAt: serverTimestamp(), // Firestore native timestamp
                    timestamp: Date.now(), // local fallback
                });

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

                await setDoc(
                    doc(db, "users", receiverId, "notifications", currentUser.id),
                    { count: increment(1) },
                    { merge: true }
                );
            },

            // SUBSCRIBE TO USERS LIST
            subscribeToUsers: () => {
                const qUsers = query(collection(db, "users"), orderBy("lastActive", "desc"));
                return onSnapshot(qUsers, (snap) => {
                    const list: User[] = [];
                    snap.forEach((docSnap) => {
                        const data = docSnap.data() as Partial<User>;
                        // Filter out current user from list
                        if (docSnap.id !== get().currentUser?.id) {
                            list.push({
                                id: docSnap.id,
                                username: data.username || "User",
                                email: data.email,
                                avatar:
                                    data.avatar ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${docSnap.id}`,
                                status: (data.status as User["status"]) || "offline",
                                lastActive: typeof data.lastActive === "number" ? data.lastActive : 0,
                                friends: data.friends || [],
                                friendRequests: data.friendRequests || [],
                            });
                        }
                    });
                    set({ users: list });
                });
            },

            // SUBSCRIBE TO NOTIFICATIONS
            subscribeToNotifications: () => {
                const { currentUser } = get();
                if (!currentUser) return () => { };

                const qNotifs = collection(db, "users", currentUser.id, "notifications");
                return onSnapshot(qNotifs, (snap) => {
                    const notifs: Record<string, number> = {};
                    snap.forEach((docSnap) => {
                        const data = docSnap.data() as { count?: number };
                        if (data && typeof data.count === "number") {
                            notifs[docSnap.id] = data.count;
                        }
                    });
                    set({ notifications: notifs });
                });
            },

            // SUBSCRIBE TO MESSAGES
            subscribeToMessages: (partnerId) => {
                const { currentUser } = get();
                if (!currentUser) return () => { };

                const chatId = [currentUser.id, partnerId].sort().join("_");
                const qMsgs = query(
                    collection(db, "chats", chatId, "messages"),
                    orderBy("timestamp", "asc")
                );

                return onSnapshot(qMsgs, (snap) => {
                    const msgs: Message[] = [];
                    snap.forEach((docSnap) => {
                        const data = docSnap.data() as {
                            senderId: string;
                            text: string;
                            timestamp?: number;
                            createdAt?: Timestamp | null;
                        };
                        const ts =
                            typeof data.timestamp === "number"
                                ? data.timestamp
                                : data.createdAt?.toMillis?.() ?? 0;

                        msgs.push({
                            id: docSnap.id,
                            senderId: data.senderId,
                            text: data.text,
                            timestamp: ts,
                        });
                    });

                    set((state) => ({
                        messages: { ...state.messages, [partnerId]: msgs },
                    }));
                });
            },

            // UPLOAD AVATAR (client-side compress -> base64 into Firestore)
            uploadAvatar: async (file: File) => {
                const { currentUser } = get();
                if (!currentUser) throw new Error("No user logged in");

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
                                if (!ctx) {
                                    reject(new Error("Canvas 2D context not available"));
                                    return;
                                }
                                ctx.drawImage(img, 0, 0, width, height);
                                resolve(canvas.toDataURL("image/jpeg", 0.7));
                            };
                            img.onerror = reject;
                        };
                        reader.onerror = reject;
                    });
                };

                try {
                    const base64Image = await compressImage(file);

                    await setDoc(
                        doc(db, "users", currentUser.id),
                        { avatar: base64Image, lastActive: Date.now() },
                        { merge: true }
                    );

                    set((state) => ({
                        currentUser: state.currentUser
                            ? { ...state.currentUser, avatar: base64Image }
                            : null,
                    }));

                    return base64Image;
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error("Error processing image:", error);
                    throw new Error("Failed to process image");
                }
            },
        }),
        {
            name: "zenith-messaging-storage",
            // Only persist currentUser to avoid rehydrating large message maps
            partialize: (state) => ({ currentUser: state.currentUser }),
            // For Next.js SSR, you might add: skipHydration: true,
        }
    )
);
