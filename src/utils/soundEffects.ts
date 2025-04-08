
import * as React from 'react';

// Sound effects for Lost and Found application

// Cache for loaded audio files
const audioCache: Record<string, HTMLAudioElement> = {};

// Available sound effects
export enum SoundEffect {
  UPLOAD_SUCCESS = 'upload-success',
  MATCH_FOUND = 'match-found',
  REPORT_SUBMITTED = 'report-submitted',
}

// Sound URLs - these would be your actual sound files
const soundUrls: Record<SoundEffect, string> = {
  [SoundEffect.UPLOAD_SUCCESS]: '/sounds/upload-success.mp3',
  [SoundEffect.MATCH_FOUND]: '/sounds/match-found.mp3',
  [SoundEffect.REPORT_SUBMITTED]: '/sounds/report-submitted.mp3',
};

/**
 * Play a sound effect
 * @param effect The sound effect to play
 * @param volume Volume level (0-1)
 */
export const playSound = (effect: SoundEffect, volume: number = 0.5): void => {
  if (!soundUrls[effect]) {
    console.warn(`Sound effect ${effect} not found`);
    return;
  }

  // Check if audio is already loaded and cached
  if (!audioCache[effect]) {
    try {
      audioCache[effect] = new Audio(soundUrls[effect]);
    } catch (error) {
      console.error(`Error loading sound effect ${effect}:`, error);
      return;
    }
  }

  const audio = audioCache[effect];
  
  // Reset audio and set volume
  audio.currentTime = 0;
  audio.volume = Math.max(0, Math.min(1, volume));
  
  // Play the sound
  const playPromise = audio.play();
  
  // Handle play promise to catch any autoplay restrictions
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      console.warn(`Error playing sound ${effect}:`, error);
    });
  }
};

// Create a hook for using sound effects with user preferences
export const useSoundEffects = () => {
  const [enabled, setEnabled] = React.useState<boolean>(() => {
    // Get user preference from localStorage
    const savedPreference = localStorage.getItem('laf-sound-effects-enabled');
    return savedPreference !== null ? savedPreference === 'true' : true;
  });

  const toggleSoundEffects = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    localStorage.setItem('laf-sound-effects-enabled', String(newValue));
  };

  const play = (effect: SoundEffect, volume: number = 0.5) => {
    if (enabled) {
      playSound(effect, volume);
    }
  };

  return {
    enabled,
    toggleSoundEffects,
    play
  };
};
