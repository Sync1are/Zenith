import { useEffect, useState } from 'react';
import { doc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useMigrationStore } from '../store/useMigrationStore';

interface FirebaseSyncOptions<T> {
    collectionName: string;
    store: any; // The Zustand store
    selector?: (state: any) => T; // Optional selector for partial state
}

const syncing: Set<string> = new Set();
const listeners: Map<string, Unsubscribe> = new Map();

/**
 * Hook to sync Zustand store with Firebase Firestore
 * Usage: useFirebaseSync({ collectionName: 'app-state', store: useAppStore });
 * 
 * Note: This hook monitors auth state and only syncs when a user is logged in
 * 
 * 🎨 Console Debug Colors:
 * 🔴 Red - No auth/errors  |  🟢 Green - Success/start
 * 📡 Blue - Fetching  |  📦 Yellow - Migration
 * 👂 Purple - Listeners  |  🔄 Light green - Updates
 * 📤 Light blue - Syncing  |  🛑 Gray - Cleanup
 */
export function useFirebaseSync<T>({ collectionName, store, selector }: FirebaseSyncOptions<T>) {
    const [currentUserId, setCurrentUserId] = useState<string | null>(auth.currentUser?.uid || null);

    // Monitor auth state changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUserId(user?.uid || null);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!currentUserId) {
            console.log(`%c[FirebaseSync] 🔴 No user logged in for ${collectionName}`, 'color: #ff6b6b; font-weight: bold');
            return;
        }

        console.log(`%c[FirebaseSync] 🟢 Starting sync for ${collectionName} (User: ${currentUserId})`, 'color: #51cf66; font-weight: bold');

        const userId = currentUserId;
        const docRef = doc(db, collectionName, userId);
        const { startMigration, completeMigration } = useMigrationStore.getState();

        // Initialize: Load from Firebase and check for migration
        const initialize = async () => {
            try {
                console.log(`%c[FirebaseSync] 📡 Fetching data from Firebase for ${collectionName}...`, 'color: #4dabf7');
                const docSnap = await getDoc(docRef);
                const firebaseData = docSnap.exists() ? docSnap.data()?.data : null;

                // Check if we need to migrate from localStorage
                const localStorageKey = `zenith-${collectionName}-storage`;
                const localData = localStorage.getItem(localStorageKey);

                if (localData && !firebaseData) {
                    // Migration needed
                    console.log(`%c[FirebaseSync] 📦 Migrating ${collectionName} to Firebase...`, 'color: #ffd43b; font-weight: bold');
                    startMigration();

                    try {
                        const parsed = JSON.parse(localData);
                        const stateToMigrate = parsed.state || parsed;

                        // Upload to Firebase
                        await setDoc(docRef, { data: stateToMigrate });
                        console.log(`%c[FirebaseSync] ✅ Migration complete for ${collectionName}`, 'color: #51cf66; font-weight: bold');

                        // Set in store
                        if (selector) {
                            store.setState(selector(stateToMigrate));
                        } else {
                            store.setState(stateToMigrate);
                        }

                        // Clear localStorage after successful migration
                        localStorage.removeItem(localStorageKey);

                        setTimeout(() => completeMigration(), 1000); // Show migration screen for a moment
                    } catch (error) {
                        console.error(`%c[FirebaseSync] ❌ Migration failed for ${collectionName}:`, 'color: #ff6b6b; font-weight: bold', error);
                        completeMigration();
                    }
                } else if (firebaseData) {
                    // Load from Firebase
                    console.log(`%c[FirebaseSync] 📥 Loading ${collectionName} from Firebase (${Object.keys(firebaseData).length} keys)`, 'color: #4dabf7');
                    if (selector) {
                        store.setState(selector(firebaseData));
                    } else {
                        store.setState(firebaseData);
                    }
                } else {
                    console.log(`%c[FirebaseSync] ℹ️ No existing data for ${collectionName} in Firebase or localStorage`, 'color: #868e96');
                }

                // Set up real-time listener
                console.log(`%c[FirebaseSync] 👂 Setting up real-time listener for ${collectionName}`, 'color: #9775fa');
                const unsubscribe = onSnapshot(docRef, (snapshot) => {
                    if (snapshot.exists() && !syncing.has(collectionName)) {
                        const data = snapshot.data()?.data;
                        if (data) {
                            console.log(`%c[FirebaseSync] 🔄 Real-time update received for ${collectionName}`, 'color: #a9e34b');
                            if (selector) {
                                store.setState(selector(data));
                            } else {
                                store.setState(data);
                            }
                        }
                    }
                }, (error) => {
                    console.error(`%c[FirebaseSync] ❌ Snapshot error for ${collectionName}:`, 'color: #ff6b6b; font-weight: bold', error);
                });

                listeners.set(collectionName, unsubscribe);

            } catch (error) {
                console.error(`%c[FirebaseSync] ❌ Error initializing ${collectionName}:`, 'color: #ff6b6b; font-weight: bold', error);
            }
        };

        initialize();

        // Sync store changes to Firebase (debounced)
        let syncTimer: NodeJS.Timeout;
        const unsubscribeStore = store.subscribe((state: any) => {
            if (!auth.currentUser) return;

            clearTimeout(syncTimer);
            syncTimer = setTimeout(async () => {
                syncing.add(collectionName);
                console.log(`%c[FirebaseSync] 📤 Syncing ${collectionName} to Firebase...`, 'color: #74c0fc');
                try {
                    const dataToSync = selector ? selector(state) : state;
                    await setDoc(docRef, { data: dataToSync }, { merge: true });
                    console.log(`%c[FirebaseSync] ✅ Sync complete for ${collectionName}`, 'color: #51cf66');
                } catch (error) {
                    console.error(`%c[FirebaseSync] ❌ Error syncing ${collectionName}:`, 'color: #ff6b6b; font-weight: bold', error);
                } finally {
                    syncing.delete(collectionName);
                }
            }, 1000); // 1 second debounce
        });

        // Cleanup
        return () => {
            console.log(`%c[FirebaseSync] 🛑 Cleaning up sync for ${collectionName}`, 'color: #868e96');
            unsubscribeStore();
            clearTimeout(syncTimer);
            const listener = listeners.get(collectionName);
            if (listener) {
                listener();
                listeners.delete(collectionName);
            }
        };
    }, [currentUserId, collectionName, store, selector]);
}

// Cleanup all listeners (call on app unmount if needed)
export function cleanupFirebaseSync() {
    listeners.forEach((unsubscribe) => unsubscribe());
    listeners.clear();
    syncing.clear();
}
