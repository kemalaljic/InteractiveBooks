/** Caption bar (top), progress stars (top-right), Bravo overlay and the page-turn curtain. Plain DOM. */
export class Hud {
  private caption = document.createElement('div');
  private progress = document.createElement('div');
  private reward = document.createElement('div');
  private curtain = document.createElement('div');
  private bravo: HTMLHeadingElement;
  private againBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private hideTimer?: number;

  constructor(root: HTMLElement, handlers: { onAgain: () => void; onNext: () => void }) {
    this.caption.className = 'caption';
    this.caption.setAttribute('aria-live', 'polite');
    this.progress.className = 'progress';
    this.curtain.className = 'curtain';

    this.reward.className = 'reward';
    this.reward.innerHTML = `<h2></h2><div class="reward-buttons">
      <button class="big-button again" type="button"></button>
      <button class="big-button next" type="button"></button></div>`;
    this.bravo = this.reward.querySelector('h2')!;
    this.againBtn = this.reward.querySelector('.again')!;
    this.nextBtn = this.reward.querySelector('.next')!;
    bindTap(this.againBtn, handlers.onAgain);
    bindTap(this.nextBtn, handlers.onNext);

    root.append(this.caption, this.progress, this.reward, this.curtain);
  }

  /** Set up for a page: number of stars, button labels, whether "next" exists. */
  configure(total: number, labels: { bravo: string; again: string; next: string }, hasNext: boolean): void {
    this.progress.replaceChildren(...Array.from({ length: total }, () => Object.assign(document.createElement('span'), { textContent: '⭐' })));
    this.bravo.textContent = labels.bravo;
    this.againBtn.textContent = `${labels.again} ↻`;
    this.nextBtn.textContent = `${labels.next} ➜`;
    this.nextBtn.hidden = !hasNext;
    this.showReward(false);
    this.hideCaption();
  }

  showCaption(text: string, holdMs = 6000): void {
    clearTimeout(this.hideTimer);
    const swap = () => {
      this.caption.textContent = text;
      this.caption.classList.add('visible');
    };
    if (this.caption.classList.contains('visible')) {
      this.caption.classList.remove('visible');
      setTimeout(swap, 120);
    } else swap();
    this.hideTimer = window.setTimeout(() => this.hideCaption(), holdMs);
  }

  hideCaption(): void {
    clearTimeout(this.hideTimer);
    this.caption.classList.remove('visible');
  }

  setProgress(found: number): void {
    [...this.progress.children].forEach((s, i) => s.classList.toggle('on', i < found));
  }

  showReward(visible: boolean): void {
    this.reward.classList.toggle('visible', visible);
  }

  /** Fade the screen out (true) or back in (false). Resolves when the fade is done. */
  setCurtain(closed: boolean): Promise<void> {
    this.curtain.classList.toggle('closed', closed);
    return new Promise((r) => setTimeout(r, 450));
  }
}

/** One tap = one action: touchend + click, deduplicated, with a short lock against double taps. */
function bindTap(el: HTMLElement, fn: () => void): void {
  let lock = false;
  const handle = (e: Event) => {
    e.preventDefault();
    if (lock) return;
    lock = true;
    setTimeout(() => (lock = false), 700);
    fn();
  };
  el.addEventListener('touchend', handle, { passive: false });
  el.addEventListener('click', handle);
}
