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
            // Check support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Your browser does not support WebRTC audio calls.');
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
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Microphone permission denied.');
            } else {
                setError('Failed to access microphone.');
            }
            setConnectionStatus('failed');
            throw err;
        }
    }, []);

    // --- 2. Create Peer Connection (FIXED) ---
    const createPeerConnection = useCallback(
        (targetUserId: string, stream: MediaStream): RTCPeerConnection => {
            const pc = new RTCPeerConnection(ICE_SERVERS);

            // A. Add local tracks to the connection
            // (Previously, this was missing the pc.addTrack call)
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

            // C. Handle Incoming Audio (FIXED: This was missing)
            pc.ontrack = (event) => {
                const remoteStream = event.streams[0];
                if (remoteStream) {
                    console.log(`🎧 Received audio stream from ${targetUserId}`);

                    // 1. Update React State (for UI icons/mute status)
                    setParticipants((prev) => {
                        const newMap = new Map(prev);
                        const existing = newMap.get(targetUserId) || { userId: targetUserId, isMicOn: true };
                        newMap.set(targetUserId, { ...existing, stream: remoteStream });
                        return newMap;
                    });

                    // 2. Play Audio (Internal hook handling)
                    let audio = audioElements.current.get(targetUserId);
                    if (!audio) {
                        audio = new Audio();
                        audio.autoplay = true;
                        audioElements.current.set(targetUserId, audio);
                    }
                    audio.srcObject = remoteStream;
                    audio.play().catch((e) => console.error("Autoplay blocked", e));
                }
            };

            // D. Handle Connection State
            pc.onconnectionstatechange = () => {
                console.log(`Connection state with ${targetUserId}:`, pc.connectionState);
                if (pc.connectionState === 'connected') {
                    // Keep the overall status as connected if at least one peer connects
                    setConnectionStatus('connected');
                } else if (pc.connectionState === 'failed') {
                    console.error(`Connection failed with ${targetUserId}`);
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

                const unsubscribe = studySessionService.listenToSession(sessionId, async (sessionData) => {
                    const participantIds = Object.keys(sessionData.participants || {}).filter((id) => id !== userId);

                    for (const participantId of participantIds) {
                        if (!peerConnections.current.has(participantId)) {
                            const pc = createPeerConnection(participantId, stream);
                            const offer = await pc.createOffer();
                            await pc.setLocalDescription(offer);
                            await studySessionService.setOffer(sessionId, userId, participantId, offer);
                        }
                    }

                    // Handle answers
                    if (sessionData.signaling?.[userId]) {
                        for (const [participantId, signalingData] of Object.entries(sessionData.signaling[userId])) {
                            const pc = peerConnections.current.get(participantId);
                            const data = signalingData as any;

                            if (pc) {
                                // FIX: Check signalingState before setting remote answer
                                if (data.answer && pc.signalingState === 'have-local-offer') {
                                    console.log('✅ Setting remote answer from', participantId);
                                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                                }

                                // Add ICE candidates only if remote description is set
                                if (data.iceCandidates && pc.remoteDescription) {
                                    for (const candidate of data.iceCandidates) {
                                        try {
                                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                                        } catch (e) {
                                            console.warn("Duplicate or invalid candidate ignored");
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                unsubscribeRef.current = unsubscribe;
                setConnectionStatus('connected');
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
                    // Check for offers addressed to ME
                    for (const [senderId, signalingData] of Object.entries(sessionData.signaling || {})) {
                        if (senderId === userId) continue;

                        const mySignaling = (signalingData as any)[userId];

                        if (mySignaling?.offer) {
                            let pc = peerConnections.current.get(senderId);

                            if (!pc) {
                                pc = createPeerConnection(senderId, stream);
                            }

                            if (pc.signalingState === 'stable') {
                                await pc.setRemoteDescription(new RTCSessionDescription(mySignaling.offer));
                                const answer = await pc.createAnswer();
                                await pc.setLocalDescription(answer);
                                await studySessionService.setAnswer(sessionId, senderId, userId, answer);
                            }

                            if (mySignaling.iceCandidates && pc.remoteDescription) {
                                for (const candidate of mySignaling.iceCandidates) {
                                    pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.warn(e));
                                }
                            }
                        }
                    }
                });

                unsubscribeRef.current = unsubscribe;
                setConnectionStatus('connected');
            } catch (err: any) {
                console.error('Error joining call:', err);
                setConnectionStatus('failed');
                setError(err.message);
            }
        },
        [createPeerConnection, getLocalStream]
    );

    // --- 5. Utility Functions ---
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
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
        }

        // Close peer connections
        peerConnections.current.forEach((pc) => pc.close());
        peerConnections.current.clear();

        // Stop audio elements
        audioElements.current.forEach((audio) => {
            audio.pause();
            audio.srcObject = null;
        });
        audioElements.current.clear();

        // Firebase cleanup
        if (currentSessionId.current && currentUserId.current) {
            studySessionService.leaveSession(currentSessionId.current, currentUserId.current);
        }
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        // Reset state
        setParticipants(new Map());
        setConnectionStatus('idle');
        setError(null);
        currentSessionId.current = null;
        currentUserId.current = null;
    }, [localStream]);

    useEffect(() => {
        return () => {
            leaveCall();
        };
    }, []); // Cleanup on unmount

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
