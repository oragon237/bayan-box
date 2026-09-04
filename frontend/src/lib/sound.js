// In-app notification sound played from the bundled mp3 asset.

import notificationSound from '../sounds/habi-sounds.mp3';

let audio = null;

export function soundEnabled() {
  return localStorage.getItem('bayanbox_sound') !== 'off';
}

export function setSoundEnabled(on) {
  localStorage.setItem('bayanbox_sound', on ? 'on' : 'off');
}

export function playNotificationChime() {
  if (!soundEnabled()) return;
  try {
    audio ??= new Audio(notificationSound);
    audio.volume = 0.6;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay blocked until the user interacts with the page — stay silent.
    });
  } catch {
    // Audio unavailable (unsupported browser) — stay silent.
  }
}
