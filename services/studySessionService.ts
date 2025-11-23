import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteField,
    onSnapshot,
    Timestamp,
    arrayUnion,
    getDoc,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface SessionParticipant {
    joinedAt: Timestamp;
    isMicOn: boolean;
}

interface SessionData {
    sessionId: string;
    hostId: string;
    createdAt: Timestamp;
    participants: Record<string, SessionParticipant>;
    signaling?: Record<string, any>;
}

class StudySessionService {
    private sessionsCollection = collection(db, 'studySessions');

    // Create a new session
    async createSession(sessionId: string, hostId: string): Promise<void> {
        const sessionRef = doc(this.sessionsCollection, sessionId);
        await setDoc(sessionRef, {
            sessionId,
            hostId,
            createdAt: Timestamp.now(),
            participants: {
                [hostId]: {
                    joinedAt: Timestamp.now(),
                    isMicOn: true,
                },
            },
            signaling: {},
        });
    }

    // Join an existing session
    async joinSession(sessionId: string, userId: string): Promise<void> {
        const sessionRef = doc(this.sessionsCollection, sessionId);

        // Check for expiration first
        const sessionDoc = await getDoc(sessionRef);
        if (sessionDoc.exists()) {
            const data = sessionDoc.data();
            if (data.expiresAt) {
                const now = Timestamp.now();
                if (now.toMillis() > data.expiresAt.toMillis()) {
                    // Expired - delete and throw
                    await deleteDoc(sessionRef);
                    throw new Error('Session has expired.');
                } else {
                    // Valid - revive session (remove expiresAt)
                    await updateDoc(sessionRef, {
                        expiresAt: deleteField()
                    });
                }
            }
        }

        await updateDoc(sessionRef, {
            [`participants.${userId}`]: {
                joinedAt: Timestamp.now(),
                isMicOn: true,
            },
        });
    }

    // Leave a session
    async leaveSession(sessionId: string, userId: string): Promise<void> {
        const sessionRef = doc(this.sessionsCollection, sessionId);

        try {
            // Remove participant
            await updateDoc(sessionRef, {
                [`participants.${userId}`]: deleteField(),
                [`signaling.${userId}`]: deleteField(),
            });

            // Also clean up signaling data where this user is the target
            const sessionDoc = await getDoc(sessionRef);
            if (sessionDoc.exists()) {
                const data = sessionDoc.data();
                const updates: Record<string, any> = {};

                // Remove this user's signaling data from other users' entries
                for (const [otherId, _] of Object.entries(data.signaling || {})) {
                    if (otherId !== userId) {
                        updates[`signaling.${otherId}.${userId}`] = deleteField();
                    }
                }

                // Check if session is empty
                const remainingParticipants = Object.keys(data.participants || {}).filter(id => id !== userId);
                if (remainingParticipants.length === 0) {
                    // Last user left - set expiration to 30 seconds from now
                    const expiresAt = Timestamp.fromMillis(Date.now() + 30000);
                    updates['expiresAt'] = expiresAt;
                }

                if (Object.keys(updates).length > 0) {
                    await updateDoc(sessionRef, updates);
                }
            }
        } catch (error) {
            console.error('Error leaving session:', error);
        }
    }

    // Update mic status
    async updateMicStatus(sessionId: string, userId: string, isMicOn: boolean): Promise<void> {
        const sessionRef = doc(this.sessionsCollection, sessionId);
        await updateDoc(sessionRef, {
            [`participants.${userId}.isMicOn`]: isMicOn,
        });
    }

    // Set offer for a peer
    async setOffer(
        sessionId: string,
        fromUserId: string,
        toUserId: string,
        offer: RTCSessionDescriptionInit
    ): Promise<void> {
        const sessionRef = doc(this.sessionsCollection, sessionId);
        await updateDoc(sessionRef, {
            [`signaling.${fromUserId}.${toUserId}.offer`]: JSON.parse(JSON.stringify(offer)),
        });
    }

    // Set answer for a peer
    async setAnswer(
        sessionId: string,
        fromUserId: string,
        toUserId: string,
        answer: RTCSessionDescriptionInit
    ): Promise<void> {
        const sessionRef = doc(this.sessionsCollection, sessionId);
        await updateDoc(sessionRef, {
            [`signaling.${fromUserId}.${toUserId}.answer`]: JSON.parse(JSON.stringify(answer)),
        });
    }

    // Add ICE candidate
    async addIceCandidate(
        sessionId: string,
        fromUserId: string,
        toUserId: string,
        candidate: RTCIceCandidateInit
    ): Promise<void> {
        const sessionRef = doc(this.sessionsCollection, sessionId);
        await updateDoc(sessionRef, {
            [`signaling.${fromUserId}.${toUserId}.iceCandidates`]: arrayUnion(
                JSON.parse(JSON.stringify(candidate))
            ),
        });
    }

    // Listen to session changes
    listenToSession(
        sessionId: string,
        callback: (data: SessionData) => void
    ): () => void {
        const sessionRef = doc(this.sessionsCollection, sessionId);

        const unsubscribe = onSnapshot(
            sessionRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    callback(snapshot.data() as SessionData);
                }
            },
            (error) => {
                console.error('Error listening to session:', error);
            }
        );

        return unsubscribe;
    }

    // Check if session exists
    async sessionExists(sessionId: string): Promise<boolean> {
        const sessionRef = doc(this.sessionsCollection, sessionId);
        const sessionDoc = await getDoc(sessionRef);

        if (!sessionDoc.exists()) return false;

        const data = sessionDoc.data();
        if (data.expiresAt) {
            const now = Timestamp.now();
            if (now.toMillis() > data.expiresAt.toMillis()) {
                // Expired - delete it lazily
                await deleteDoc(sessionRef);
                return false;
            }
        }

        return true;
    }
}

export const studySessionService = new StudySessionService();
