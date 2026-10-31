import './ui/styles.css';
import { registerSW } from 'virtual:pwa-register';
import { AudioManager } from './audio/AudioManager';
import { resolveBook } from './content';
import { ambientResolvers, ambientUrlsFor } from './core/assets';
import { Book } from './scene/Book';
import { audioUrlsFor } from './scene/PageController';
import { Particles } from './scene/Particles';
import { Stage } from './scene/Stage';
import { Hud } from './ui/Hud';
import { showStartScreen } from './ui/StartScreen';

// Offline: precache everything, update silently in the background.
registerSW({ immediate: true });

// Safari ignores user-scalable=no for pinch; block it (and double-tap zoom) explicitly.
for (const ev of ['gesturestart', 'gesturechange', 'dblclick']) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}

const { pages, startIndex } = resolveBook();
const appEl = document.getElementById('app')!;
const uiEl = document.getElementById('ui')!;

const audio = new AudioManager();
audio.installLifecycleHandlers();

const stage = new Stage();
let book: Book;
const hud = new Hud(uiEl, { onAgain: () => book.controller?.again(), onNext: () => book.next() });

const sceneReady = (async () => {
  await stage.init(appEl);
  const particles = new Particles(stage.fx, stage.app.renderer, stage.app.ticker);
  book = new Book(stage, audio, hud, particles, pages);
  book.index = startIndex;
  await book.load(startIndex);
})();

// Create + decode the first page's audio right away (before the tap), so the first sounds are instant.
const first = pages[startIndex];
void audio.ambient.preload(ambientUrlsFor(first));
const audioReady = audio.preload(audioUrlsFor(first));

// The start screen goes up immediately. It doesn't wait for anything async.
showStartScreen(uiEl, first.bookTitle, first.ui.start, () => {
  // ── Inside the gesture. Keep this block synchronous. ──
  audio.unlock();
  audio.startAmbient(first.ambient, ambientResolvers);
  // ── Async from here on is fine. ──
  void sceneReady.then(() => {
    book.controller!.start(audioReady);
    if (startIndex + 1 < pages.length) void audioReady.then(() => book.preloadAudio(startIndex + 1));
  });
});

sceneReady.catch((err) => {
  console.error(err);
  uiEl.insertAdjacentHTML('beforeend', `<pre style="position:absolute;bottom:0;color:#900">${String(err)}</pre>`);
});

// Handy for debugging on the device via Safari Web Inspector.
Object.assign(window, {
  __storybook: {
    audio,
    stage,
    get book() {
      return book;
    },
    get controller() {
      return book?.controller;
    },
    get page() {
      return book?.page;
    },
  },
});
