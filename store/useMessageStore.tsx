import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: string;
    username: string;
    avatar?: string;
    status: 'online' | 'offline' | 'busy';
}

export interface Message {
    id: string;
    senderId: string; // 'me' or userId
    text: string;
    timestamp: number;
}

interface MessageState {
    users: User[];
    messages: Record<string, Message[]>; // userId -> messages
    activeUserId: string | null; // null = home

    addUser: (username: string) => void;
    sendMessage: (userId: string, text: string) => void;
    setActiveUser: (userId: string | null) => void;
}

export const useMessageStore = create<MessageState>()(
    persist(
        (set, get) => ({
            users: [
                { id: 'u1', username: 'Alice', status: 'online' },
                { id: 'u2', username: 'Bob', status: 'busy' },
            ],
            messages: {
                'u1': [
                    { id: 'm1', senderId: 'u1', text: 'Hey! How is the project going?', timestamp: Date.now() - 100000 },
                    { id: 'm2', senderId: 'me', text: 'Pretty good! Just refactoring the UI.', timestamp: Date.now() - 50000 }
                ]
            },
            activeUserId: null,

            addUser: (username) => set((state) => ({
                users: [
                    ...state.users,
                    {
                        id: `u${Date.now()}`,
                        username,
                        status: 'offline',
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
                    }
                ]
            })),

            sendMessage: (userId, text) => set((state) => {
                const newMsg: Message = {
                    id: `m${Date.now()}`,
                    senderId: 'me',
                    text,
                    timestamp: Date.now(),
                };
                return {
                    messages: {
                        ...state.messages,
                        [userId]: [...(state.messages[userId] || []), newMsg]
                    }
                };
            }),

            setActiveUser: (userId) => set({ activeUserId: userId })
        }),
        {
            name: 'zenith-messaging-storage',
        }
    )
);
