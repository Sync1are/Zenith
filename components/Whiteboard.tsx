import React, { useEffect, useState, useCallback } from 'react';
import { Tldraw, TldrawFile, Editor, StoreSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAppStore } from '../store/useAppStore';

interface WhiteboardProps {
    sessionCode: string;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ sessionCode }) => {
    const [editor, setEditor] = useState<Editor | null>(null);
    const { currentUser } = useAppStore(); // Assuming we might want to track who is editing later

    // Load initial data
    useEffect(() => {
        if (!editor) return;

        const whiteboardRef = doc(db, 'study_sessions', sessionCode, 'whiteboard', 'data');

        // Subscribe to remote changes
        const unsubscribe = onSnapshot(whiteboardRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data && data.snapshot) {
                    // We need to be careful not to overwrite local work if we are the ones who just saved it.
                    // For this simple implementation, we will just load it if it's different.
                    // A robust implementation needs vector clocks or CRDTs.
                    // For now, we'll just load it.
                    try {
                        // Check if the snapshot is actually different to avoid loops?
                        // editor.loadSnapshot(data.snapshot);
                        // This is a bit dangerous for loops.
                        // Let's rely on the fact that we only save debounced.

                        // A simple check: if we are dragging, don't update?
                        // Or better: only update if the remote timestamp is newer than our last save?

                        // For MVP: Let's just load it once on mount, and then maybe rely on manual refresh or
                        // accept that it's "last write wins" and might be jumpy.

                        // Actually, tldraw has a merge mechanism.
                        // But let's start simple: Load once.
                    } catch (e) {
                        console.error("Failed to load snapshot", e);
                    }
                }
            }
        });

        // Initial load
        getDoc(whiteboardRef).then((docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data && data.snapshot) {
                    try {
                        editor.loadSnapshot(data.snapshot);
                    } catch (e) {
                        console.error("Failed to load initial snapshot", e);
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [editor, sessionCode]);

    // Save changes
    useEffect(() => {
        if (!editor) return;

        const saveToFirestore = async () => {
            const snapshot = editor.getSnapshot();
            const whiteboardRef = doc(db, 'study_sessions', sessionCode, 'whiteboard', 'data');
            try {
                await setDoc(whiteboardRef, {
                    snapshot,
                    lastUpdated: Date.now(),
                    updatedBy: currentUser?.id || 'anonymous'
                });
            } catch (e) {
                console.error("Error saving whiteboard", e);
            }
        };

        // Debounce save
        let timeout: NodeJS.Timeout;
        const handleChange = () => {
            clearTimeout(timeout);
            timeout = setTimeout(saveToFirestore, 1000); // Save 1s after last change
        };

        const cleanup = editor.store.listen(handleChange);

        return () => {
            cleanup();
            clearTimeout(timeout);
        };
    }, [editor, sessionCode, currentUser]);

    return (
        <div className="absolute inset-0 w-full h-full bg-white rounded-xl overflow-hidden">
            <Tldraw
                onMount={setEditor}
                persistenceKey={`zenith-whiteboard-${sessionCode}`} // LocalStorage backup
                // Hide the UI we don't need
                hideUi={false}
            />
        </div>
    );
};

export default Whiteboard;
