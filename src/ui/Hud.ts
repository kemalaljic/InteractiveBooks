/** Caption bar (top), progress stars (top-right) and the Bravo overlay. Plain DOM for crisp text. */
export class Hud {
  private caption = document.createElement('div');
  private progress = document.createElement('div');
  private reward = document.createElement('div');
  private hideTimer?: number;

  constructor(
    root: HTMLElement,
    total: number,
    labels: { bravo: string; again: string },
    onAgain: () => void,
  ) {
    this.caption.className = 'caption';
    this.caption.setAttribute('aria-live', 'polite');

    this.progress.className = 'progress';
    for (let i = 0; i < total; i++) this.progress.appendChild(document.createElement('span')).textContent = '⭐';

    this.reward.className = 'reward';
    this.reward.innerHTML = `<h2></h2><button class="big-button again" type="button"></button>`;
    this.reward.querySelector('h2')!.textContent = labels.bravo;
    const again = this.reward.querySelector('button')!;
    again.textContent = `${labels.again} ↻`;
    let lock = false;
    const handleAgain = (e: Event) => {
      e.preventDefault();
      if (lock) return;
      lock = true;
      setTimeout(() => (lock = false), 600);
      onAgain();
    };
    again.addEventListener('touchend', handleAgain, { passive: false });
    again.addEventListener('click', handleAgain);

    root.append(this.caption, this.progress, this.reward);
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
    this.hideTimer = window.setTimeout(() => this.caption.classList.remove('visible'), holdMs);
  }

  setProgress(found: number): void {
    [...this.progress.children].forEach((s, i) => s.classList.toggle('on', i < found));
  }

  showReward(visible: boolean): void {
    this.reward.classList.toggle('visible', visible);
  }
}
