/**
 * Full-screen "Kreni!" overlay. Its only real job is to deliver a genuine user gesture.
 *
 * `onStart` is called SYNCHRONOUSLY inside the touchend/click handler. Put the audio
 * unlock first inside it, before any await or promise. That is the iOS rule.
 */
export function showStartScreen(root: HTMLElement, title: string, buttonLabel: string, onStart: () => void): void {
  const el = document.createElement('div');
  el.className = 'start';
  el.innerHTML = `<h1></h1><button class="big-button" type="button"></button>`;
  el.querySelector('h1')!.textContent = title;
  const button = el.querySelector('button')!;
  button.textContent = buttonLabel;
  root.appendChild(el);

  let started = false;
  const handler = (e: Event) => {
    if (started) return;
    started = true;
    if (e.type === 'touchend') e.preventDefault(); // suppress the follow-up click
    onStart(); // ← synchronous: unlock happens in here, inside the gesture
    el.classList.add('hidden');
    setTimeout(() => el.remove(), 500);
  };
  // touchend and click are both "user activation" events in WebKit. pointerdown is not reliable for audio.
  // The whole overlay is the target: a toddler won't hit the button precisely.
  el.addEventListener('touchend', handler, { passive: false });
  el.addEventListener('click', handler);
}
