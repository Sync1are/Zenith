import { create } from 'zustand';

interface MigrationState {
    isMigrating: boolean;
    startMigration: () => void;
    completeMigration: () => void;
}

export const useMigrationStore = create<MigrationState>((set) => ({
    isMigrating: false,
    startMigration: () => set({ isMigrating: true }),
    completeMigration: () => set({ isMigrating: false }),
}));
