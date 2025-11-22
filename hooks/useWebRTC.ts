import { useState, useEffect, useRef, useCallback } from 'react';
import { studySessionService } from '../services/studySessionService';

interface Participant {
    userId: string;
    isMicOn: boolean;
    stream?: MediaStream;
}

interface UseWebRTCReturn {
    localStream: MediaStream | null;
    participants: Map<string, Participant>;
    isMicOn: boolean;
    connectionStatus: 'idle' | 'connecting' | 'connected' | 'failed' | 'disconnected';
    error: string | null;
    initializeCall: (sessionId: string, userId: string) => Promise<void>;
    joinCall: (sessionId: string, userId: string) => Promise<void>;
    toggleMic: () => void;
    leaveCall: () => void;
}

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export const useWebRTC = (): UseWebRTCReturn => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
    const [isMicOn, setIsMicOn] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<
        'idle' | 'connecting' | 'connected' | 'failed' | 'disconnected'
    >('idle');
    const [error, setError] = useState<string | null>(null);

    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());
    const currentSessionId = useRef<string | null>(null);
    const currentUserId = useRef<string | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // --- 1. Get Local Stream ---
    const getLocalStream = useCallback(async (): Promise<MediaStream> => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('WebRTC not supported in this browser.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            });

            console.log('🎤✅ Microphone access granted');
            setLocalStream(stream);
            return stream;
        } catch (err: any) {
            console.error('Error accessing microphone:', err);
            setError(err.message || 'Failed to access microphone');
            setConnectionStatus('failed');
            throw err;
        }
    }, []);

    // --- 2. Create Peer Connection ---
    const createPeerConnection = useCallback(
        (targetUserId: string, stream: MediaStream): RTCPeerConnection => {
            const pc = new RTCPeerConnection(ICE_SERVERS);

            // A. Add local tracks to the connection
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            // B. Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate && currentSessionId.current && currentUserId.current) {
                    studySessionService.addIceCandidate(
                        currentSessionId.current,
                        currentUserId.current,
                        targetUserId,
                        event.candidate
                    );
                }
            };

            // C. Handle Connection State
            pc.onconnectionstatechange = () => {
                console.log(`Connection state with ${targetUserId}:`, pc.connectionState);
                if (pc.connectionState === 'connected') {
                    setConnectionStatus('connected');
                } else if (pc.connectionState === 'failed') {
                    setConnectionStatus('failed');
                    setError('Connection failed');
                } else if (pc.connectionState === 'disconnected') {
                    // Optional: Handle temporary disconnects
                }
            };

            // D. Handle Incoming Audio Streams (CRITICAL FIX)
            pc.ontrack = (event) => {
                const remoteStream = event.streams[0];
                if (remoteStream) {
                    console.log(`🎧 Received audio stream from ${targetUserId}`);

                    // Play audio via hidden HTMLAudioElement
                    let audio = audioElements.current.get(targetUserId);
                    if (!audio) {
                        audio = new Audio();
                        audio.autoplay = true; // Important for hearing immediately
                        audioElements.current.set(targetUserId, audio);
                    }
                    audio.srcObject = remoteStream;

                    // Update React state for UI
                    setParticipants((prev) => {
                        const newMap = new Map(prev);
                        const existing = newMap.get(targetUserId) || {
                            userId: targetUserId,
                            isMicOn: true
                        };
                        newMap.set(targetUserId, { ...existing, stream: remoteStream });
                        return newMap;
                    });
                }
            };

            peerConnections.current.set(targetUserId, pc);
            return pc;
        },
        []
    );

    // --- 3. Initialize Call (Host) ---
    const initializeCall = useCallback(
        async (sessionId: string, userId: string) => {
            try {
                setConnectionStatus('connecting');
                setError(null);
                currentSessionId.current = sessionId;
                currentUserId.current = userId;

                const stream = await getLocalStream();
                await studySessionService.createSession(sessionId, userId);

                // Listen for session updates
                const unsubscribe = studySessionService.listenToSession(sessionId, async (sessionData) => {
                    // 1. Handle new participants joining (Host creates Offer)
                    const participantIds = Object.keys(sessionData.participants || {})
                        .filter((id) => id !== userId);

                    for (const participantId of participantIds) {
                        if (!peerConnections.current.has(participantId)) {
                            const pc = createPeerConnection(participantId, stream);
                            const offer = await pc.createOffer();
                            await pc.setLocalDescription(offer);
                            await studySessionService.setOffer(sessionId, userId, participantId, offer);
                        }
                    }

                    // 2. Handle answers from participants
                    if (sessionData.signaling?.[userId]) {
                        for (const [participantId, signalingData] of Object.entries(sessionData.signaling[userId])) {
                            const pc = peerConnections.current.get(participantId);
                            const data = signalingData as any;

                            if (pc) {
                                // Set Remote Description (Answer)
                                if (data.answer && !pc.currentRemoteDescription) {
                                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                                }
                                // Add ICE Candidates
                                if (data.iceCandidates) {
                                    // Ensure we process candidates only after remote description is set or queue them
                                    // For simplicity in this snippet:
                                    for (const candidate of data.iceCandidates) {
                                        try {
                                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                                        } catch (e) {
                                            console.warn("Error adding ice candidate", e);
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                unsubscribeRef.current = unsubscribe;
            } catch (err: any) {
                console.error('Error initializing call:', err);
                setConnectionStatus('failed');
                setError(err.message);
            }
        },
        [createPeerConnection, getLocalStream]
    );

    // --- 4. Join Call (Participant) ---
    const joinCall = useCallback(
        async (sessionId: string, userId: string) => {
            try {
                setConnectionStatus('connecting');
                setError(null);
                currentSessionId.current = sessionId;
                currentUserId.current = userId;

                const stream = await getLocalStream();
                await studySessionService.joinSession(sessionId, userId);

                const unsubscribe = studySessionService.listenToSession(sessionId, async (sessionData) => {
                    // Iterate through hosts/other users to find offers directed at ME
                    for (const [senderId, signalingData] of Object.entries(sessionData.signaling || {})) {
                        if (senderId === userId) continue; // Skip my own signaling box

                        // Check if this sender has sent something to ME
                        const mySignaling = (signalingData as any)[userId];

                        if (mySignaling?.offer) {
                            let pc = peerConnections.current.get(senderId);

                            if (!pc) {
                                pc = createPeerConnection(senderId, stream);
                            }

                            // If we haven't accepted this offer yet
                            if (pc.signalingState === 'stable' && !pc.currentRemoteDescription) {
                                // This logic ensures we don't set remote desc twice for the same offer
                                await pc.setRemoteDescription(new RTCSessionDescription(mySignaling.offer));
                                const answer = await pc.createAnswer();
                                await pc.setLocalDescription(answer);
                                await studySessionService.setAnswer(sessionId, senderId, userId, answer);
                            }

                            // Handle ICE Candidates
                            if (mySignaling.iceCandidates) {
                                for (const candidate of mySignaling.iceCandidates) {
                                    try {
                                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                                    } catch (e) {
                                        console.warn("Error adding ice candidate", e);
                                    }
                                }
                            }
                        }
                    }
                });

                unsubscribeRef.current = unsubscribe;
            } catch (err: any) {
                console.error('Error joining call:', err);
                setConnectionStatus('failed');
                setError(err.message);
            }
        },
        [createPeerConnection, getLocalStream]
    );

    // --- 5. Controls ---
    const toggleMic = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);

                if (currentSessionId.current && currentUserId.current) {
                    studySessionService.updateMicStatus(
                        currentSessionId.current,
                        currentUserId.current,
                        audioTrack.enabled
                    );
                }
            }
        }
    }, [localStream]);

    const leaveCall = useCallback(() => {
        // Stop local tracks
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
        }

        // Close all connections
        peerConnections.current.forEach((pc) => pc.close());
        peerConnections.current.clear();

        // Cleanup audio elements
        audioElements.current.forEach((audio) => {
            audio.pause();
            audio.srcObject = null;
        });
        audioElements.current.clear();

        // Notify backend
        if (currentSessionId.current && currentUserId.current) {
            studySessionService.leaveSession(currentSessionId.current, currentUserId.current);
        }

        // Stop listening
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        // Reset state
        setParticipants(new Map());
        setConnectionStatus('disconnected');
        currentSessionId.current = null;
        currentUserId.current = null;
    }, [localStream]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            leaveCall();
        };
    }, []); // Empty dependency array is usually safer for unmount cleanup

    return {
        localStream,
        participants,
        isMicOn,
        connectionStatus,
        error,
        initializeCall,
        joinCall,
        toggleMic,
        leaveCall,
    };
};
