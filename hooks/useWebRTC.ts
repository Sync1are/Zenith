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
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed' | 'disconnected'>('idle');
    const [error, setError] = useState<string | null>(null);

    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());
    const currentSessionId = useRef<string | null>(null);
    const currentUserId = useRef<string | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Get local audio stream
    const getLocalStream = async (): Promise<MediaStream> => {
        try {
            // Check if mediaDevices API is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error(
                    'Your browser does not support audio calls. Please use a modern browser or ensure you are accessing the app via HTTPS or localhost.'
                );
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            });
            setLocalStream(stream);
            return stream;
        } catch (err: any) {
            console.error('Error accessing microphone:', err);

            // Provide user-friendly error messages
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Microphone permission denied. Please allow microphone access to use voice calls.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError('No microphone found. Please connect a microphone and try again.');
            } else if (err.message && (err.message.includes('HTTPS') || err.message.includes('browser'))) {
                setError(err.message);
            } else {
                setError('Failed to access microphone. Please check your browser settings.');
            }

            setConnectionStatus('failed');
            throw err;
        }
    };

    // Create peer connection for a user
    const createPeerConnection = useCallback(
        (userId: string, stream: MediaStream): RTCPeerConnection => {
            const pc = new RTCPeerConnection(ICE_SERVERS);

            // Add local audio tracks
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            // Handle incoming remote stream
            pc.ontrack = (event) => {
                console.log('Received remote track from:', userId);
                console.log('Remote stream:', event.streams[0]);

                setParticipants((prev) => {
                    const updated = new Map(prev);
                    const participant = updated.get(userId) || { userId, isMicOn: true };
                    participant.stream = event.streams[0];
                    updated.set(userId, participant);
                    return updated;
                });

                // Play remote audio - create persistent audio element
                let audio = audioElements.current.get(userId);
                if (!audio) {
                    audio = new Audio();
                    audio.autoplay = true;
                    audio.volume = 1.0;
                    audioElements.current.set(userId, audio);
                    console.log('Created new audio element for:', userId);
                }

                audio.srcObject = event.streams[0];
                audio.play().then(() => {
                    console.log('Successfully playing audio from:', userId);
                }).catch((e) => {
                    console.error('Error playing remote audio:', e);
                    // Try again after user interaction
                    setTimeout(() => {
                        audio?.play().catch(console.error);
                    }, 1000);
                });
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate && currentSessionId.current && currentUserId.current) {
                    studySessionService.addIceCandidate(
                        currentSessionId.current,
                        currentUserId.current,
                        userId,
                        event.candidate
                    );
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log('Connection state:', pc.connectionState);
                if (pc.connectionState === 'connected') {
                    setConnectionStatus('connected');
                } else if (pc.connectionState === 'failed') {
                    setConnectionStatus('failed');
                    setError('Connection failed. Please try again.');
                } else if (pc.connectionState === 'disconnected') {
                    setConnectionStatus('disconnected');
                }
            };

            peerConnections.current.set(userId, pc);
            return pc;
        },
        []
    );

    // Initialize as host
    const initializeCall = useCallback(async (sessionId: string, userId: string) => {
        try {
            setConnectionStatus('connecting');
            setError(null);
            currentSessionId.current = sessionId;
            currentUserId.current = userId;

            // Get local stream
            const stream = await getLocalStream();

            // Create session in Firebase
            await studySessionService.createSession(sessionId, userId);

            // Listen for new participants
            const unsubscribe = studySessionService.listenToSession(sessionId, async (sessionData) => {
                const participantIds = Object.keys(sessionData.participants || {}).filter(id => id !== userId);

                for (const participantId of participantIds) {
                    if (!peerConnections.current.has(participantId)) {
                        // Create peer connection and offer
                        const pc = createPeerConnection(participantId, stream);
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);

                        // Send offer to Firebase
                        await studySessionService.setOffer(sessionId, userId, participantId, offer);
                    }
                }

                // Handle answers
                if (sessionData.signaling?.[userId]) {
                    for (const [participantId, signalingData] of Object.entries(sessionData.signaling[userId])) {
                        const pc = peerConnections.current.get(participantId);
                        if (pc && (signalingData as any).answer && !pc.currentRemoteDescription) {
                            await pc.setRemoteDescription(new RTCSessionDescription((signalingData as any).answer));
                        }

                        // Add ICE candidates
                        if ((signalingData as any).iceCandidates) {
                            for (const candidate of (signalingData as any).iceCandidates) {
                                if (pc && candidate) {
                                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                                }
                            }
                        }
                    }
                }
            });

            unsubscribeRef.current = unsubscribe;
            setConnectionStatus('connected');
        } catch (err) {
            console.error('Error initializing call:', err);
            setConnectionStatus('failed');
        }
    }, [createPeerConnection]);

    // Join existing call
    const joinCall = useCallback(async (sessionId: string, userId: string) => {
        try {
            setConnectionStatus('connecting');
            setError(null);
            currentSessionId.current = sessionId;
            currentUserId.current = userId;

            // Get local stream
            const stream = await getLocalStream();

            // Join session in Firebase
            await studySessionService.joinSession(sessionId, userId);

            // Listen for offers from host
            const unsubscribe = studySessionService.listenToSession(sessionId, async (sessionData) => {
                // Handle offers from other participants
                for (const [hostId, signalingData] of Object.entries(sessionData.signaling || {})) {
                    if (hostId === userId) continue;

                    const participantSignaling = (signalingData as any)[userId];
                    if (participantSignaling?.offer) {
                        let pc = peerConnections.current.get(hostId);

                        if (!pc) {
                            pc = createPeerConnection(hostId, stream);
                        }

                        if (!pc.currentRemoteDescription) {
                            await pc.setRemoteDescription(new RTCSessionDescription(participantSignaling.offer));
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);

                            // Send answer back
                            await studySessionService.setAnswer(sessionId, hostId, userId, answer);
                        }

                        // Add ICE candidates
                        if (participantSignaling.iceCandidates) {
                            for (const candidate of participantSignaling.iceCandidates) {
                                if (candidate) {
                                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                                }
                            }
                        }
                    }
                }
            });

            unsubscribeRef.current = unsubscribe;
            setConnectionStatus('connected');
        } catch (err) {
            console.error('Error joining call:', err);
            setConnectionStatus('failed');
        }
    }, [createPeerConnection]);

    // Toggle microphone
    const toggleMic = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);

                // Update Firebase
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

    // Leave call and cleanup
    const leaveCall = useCallback(() => {
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
        }

        // Close all peer connections
        peerConnections.current.forEach((pc) => pc.close());
        peerConnections.current.clear();

        // Stop and remove all audio elements
        audioElements.current.forEach((audio) => {
            audio.pause();
            audio.srcObject = null;
        });
        audioElements.current.clear();

        // Leave session in Firebase
        if (currentSessionId.current && currentUserId.current) {
            studySessionService.leaveSession(currentSessionId.current, currentUserId.current);
        }

        // Unsubscribe from listeners
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            leaveCall();
        };
    }, [leaveCall]);

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
