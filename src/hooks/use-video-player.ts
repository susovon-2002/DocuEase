'use client';

import { create } from 'zustand';

interface VideoPlayerState {
  isOpen: boolean;
  openPlayer: () => void;
  closePlayer: () => void;
  togglePlayer: () => void;
}

export const useVideoPlayer = create<VideoPlayerState>((set) => ({
  isOpen: false,
  openPlayer: () => set({ isOpen: true }),
  closePlayer: () => set({ isOpen: false }),
  togglePlayer: () => set((state) => ({ isOpen: !state.isOpen })),
}));
