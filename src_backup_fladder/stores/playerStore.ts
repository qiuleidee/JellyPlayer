import { create } from 'zustand';

export interface PlayerTrack {
  id: number;
  name: string;
  lang?: string;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isBuffering: boolean;
  maxBitrate: number | null; // null 表示 Auto (无限制，最大 140Mbps)
  qualities: any[];
  seekTarget: number | null;
  
  // Tracks
  audioTracks: PlayerTrack[];
  subtitleTracks: PlayerTrack[];
  currentAudioTrack: number;
  currentSubtitleTrack: number;
  subtitleOffset: number;
  
  // Actions
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  setIsFullscreen: (full: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setMaxBitrate: (bitrate: number | null) => void;
  setQualities: (qs: any[]) => void;
  setSeekTarget: (time: number | null) => void;
  
  setAudioTracks: (tracks: PlayerTrack[]) => void;
  setSubtitleTracks: (tracks: PlayerTrack[]) => void;
  setCurrentAudioTrack: (index: number) => void;
  setCurrentSubtitleTrack: (index: number) => void;
  setSubtitleOffset: (offset: number) => void;
  
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isFullscreen: false,
  isBuffering: false,
  maxBitrate: null,
  qualities: [],
  seekTarget: null,
  audioTracks: [],
  subtitleTracks: [],
  currentAudioTrack: -1,
  currentSubtitleTrack: -1,
  subtitleOffset: 0,

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration: duration }),
  setVolume: (volume) => set({ volume }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  setIsFullscreen: (full) => set({ isFullscreen: full }),
  setIsBuffering: (buffering) => set({ isBuffering: buffering }),
  setMaxBitrate: (b) => set({ maxBitrate: b }),
  setQualities: (qs) => set({ qualities: qs }),
  setSeekTarget: (time) => set({ seekTarget: time }),
  setAudioTracks: (tracks) => set({ audioTracks: tracks }),
  setSubtitleTracks: (tracks) => set({ subtitleTracks: tracks }),
  setCurrentAudioTrack: (index) => set({ currentAudioTrack: index }),
  setCurrentSubtitleTrack: (index) => set({ currentSubtitleTrack: index }),
  setSubtitleOffset: (offset) => set({ subtitleOffset: offset }),
  reset: () => set({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    isBuffering: false,
    seekTarget: null,
    audioTracks: [],
    subtitleTracks: [],
    currentAudioTrack: -1,
    currentSubtitleTrack: -1,
    subtitleOffset: 0,
  })
}));
