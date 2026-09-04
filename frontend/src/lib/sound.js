// In-app notification sound played from the bundled mp3 asset.
// Mobile browsers (iOS Safari / Android Chrome) refuse media.play() unless
// that specific Audio element was "unlocked" inside a real user gesture.
// Poll-driven notification chimes always run outside a gesture — so we
// pre-unlock the element on the user's first tap (muted and inaudible).

import notificationSound from '../sounds/habi-sounds.mp3';

let audio = null;

export function soundEnabled() {
  return localStorage.getItem('bayanbox_sound') !== 'off';
}

export function setSoundEnabled(on) {
  localStorage.setItem('bayanbox_sound', on ? 'on' : 'off');
}

function el() {
  if (!audio) {
    audio = new Audio(notificationSound);
    audio.preload = 'auto';
  }
  return audio;
}

function unlock() {
  const a = el();
  a.volume = 0.0001;
  const done = () => { a.pause(); a.currentTime = 0; };
  a.play().then(done).catch(() => {});
}

['pointerdown', 'touchend', 'keydown'].forEach((ev) =>
  window.addEventListener(ev, unlock, { once: true, capture: true }),
);

export function playNotificationChime() {
  if (!soundEnabled()) return;
  try {
    const a = el();
    a.volume = 0.6;
    a.currentTime = 0;
    a.play().catch(() => {
      // Still gesture-locked (e.g. background tab before any tap) —
      // retried automatically after the next user interaction.
    });
  } catch {
    // Audio unavailable (unsupported browser) — stay silent.
  }
}
