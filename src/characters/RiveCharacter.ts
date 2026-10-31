import { Container, Sprite, Texture } from 'pixi.js';
import type { Rive, StateMachineInput } from '@rive-app/canvas';
import { asset } from '../core/assets';
import type { RiveArt, SceneObjectConfig } from '../core/types';
import type { Character } from './Character';

const STATE_MACHINE = 'Main';
let runtimeConfigured = false;

/** Point the Rive runtime at the bundled wasm (default is a CDN, which breaks offline). */
async function loadRuntime() {
  const rive = await import('@rive-app/canvas');
  if (!runtimeConfigured) {
    const wasmUrl = (await import('@rive-app/canvas/rive.wasm?url')).default;
    rive.RuntimeLoader.setWasmUrl(wasmUrl);
    rive.RuntimeLoader.setWasmFallbackUrl(null); // never reach for jsdelivr
    runtimeConfigured = true;
  }
  return rive;
}

function holder(): HTMLElement {
  let el = document.querySelector<HTMLElement>('.rive-holder');
  if (!el) {
    el = document.createElement('div');
    el.className = 'rive-holder';
    document.body.appendChild(el);
  }
  return el;
}

/**
 * A Rive artboard rendered into its own canvas, uploaded each frame as a Pixi texture so it
 * sits inside the scene graph (parallax, z-order, particles all just work).
 * Contract: state machine "Main" with trigger inputs "tap" and (optionally) "happy".
 */
export class RiveCharacter implements Character {
  readonly view = new Container();
  readonly reactionDuration = 1;
  private rive?: Rive;
  private texture?: Texture;
  private inputs: StateMachineInput[] = [];
  private canvas = document.createElement('canvas');

  constructor(
    readonly config: SceneObjectConfig,
    private readonly art: RiveArt,
  ) {
    this.view.position.set(config.x, config.y);
    this.view.zIndex = config.z ?? 0;
    if (config.scale) this.view.scale.set(config.scale);
  }

  async load(): Promise<void> {
    const { Rive, Layout, Fit, Alignment } = await loadRuntime();
    const res = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.art.width * res);
    this.canvas.height = Math.round(this.art.height * res);
    // Rive skips drawing for canvases it thinks are off-screen, so keep it in the DOM (invisible).
    holder().appendChild(this.canvas);

    await new Promise<void>((resolve, reject) => {
      this.rive = new Rive({
        src: asset(this.art.src),
        canvas: this.canvas,
        artboard: this.art.artboard,
        stateMachines: STATE_MACHINE,
        autoplay: true,
        layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
        onLoad: () => resolve(),
        onLoadError: (e) => reject(new Error(`Rive load failed: ${this.art.src} ${String(e?.data ?? '')}`)),
      });
    });

    this.inputs = this.rive!.stateMachineInputs(STATE_MACHINE) ?? [];
    if (!this.inputs.some((i) => i.name === 'tap')) {
      console.warn(`[rive] ${this.art.src}: state machine "${STATE_MACHINE}" has no "tap" input`);
    }
    this.texture = Texture.from(this.canvas);
    const sprite = new Sprite(this.texture);
    sprite.anchor.set(0.5);
    sprite.width = this.art.width;
    sprite.height = this.art.height;
    this.view.addChild(sprite);
  }

  update(): void {
    this.texture?.source.update(); // re-upload the frame Rive just drew
  }

  tap(): void {
    this.fire('tap');
  }

  happy(): void {
    this.fire('happy') || this.fire('tap');
  }

  private fire(name: string): boolean {
    const input = this.inputs.find((i) => i.name === name);
    input?.fire();
    return !!input;
  }

  destroy(): void {
    this.rive?.cleanup();
    this.canvas.remove();
    this.view.destroy({ children: true });
    this.texture?.destroy(true);
  }
}
