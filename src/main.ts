import './ui/styles.css';
import { registerSW } from 'virtual:pwa-register';
import { AudioManager } from './audio/AudioManager';
import { resolvePage } from './content';
import { ambientUrl } from './core/assets';
import { audioUrlsFor, PageController } from './scene/PageController';
import { Stage } from './scene/Stage';
import { Hud } from './ui/Hud';
import { showStartScreen } from './ui/StartScreen';

// Offline: precache everything, update silently in the background.
registerSW({ immediate: true });

// Safari ignores user-scalable=no for pinch; block it (and double-tap zoom) explicitly.
for (const ev of ['gesturestart', 'gesturechange', 'dblclick']) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}

const page = resolvePage();
const appEl = document.getElementById('app')!;
const uiEl = document.getElementById('ui')!;

const audio = new AudioManager();
audio.installLifecycleHandlers();
// Create + decode all Howls now (before the tap), so the first sounds are instant.
const audioReady = audio.preload(audioUrlsFor(page));

const stage = new Stage();
let controller: PageController;
const hud = new Hud(uiEl, page.objects.length, page.ui, () => controller.again());

const sceneReady = (async () => {
  await stage.init(appEl);
  controller = new PageController(stage, audio, hud, page);
  await controller.build();
})();

// The start screen goes up immediately. It doesn't wait for anything async.
showStartScreen(uiEl, page.bookTitle, page.ui.start, () => {
  // ── Inside the gesture. Keep this block synchronous. ──
  audio.unlock();
  audio.startAmbient(ambientUrl(page.ambient), page.ambientVolume);
  // ── Async from here on is fine. ──
  void sceneReady.then(() => controller.start(audioReady));
});

sceneReady.catch((err) => {
  console.error(err);
  uiEl.insertAdjacentHTML('beforeend', `<pre style="position:absolute;bottom:0;color:#900">${String(err)}</pre>`);
});

// Handy for debugging on the device via Safari Web Inspector.
Object.assign(window, { __storybook: { audio, stage, page, get controller() { return controller; } } });
