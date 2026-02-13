import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class World {
  universalClock: THREE.Clock;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  _renderClock: THREE.Clock;
  _systems: System[];
  _callOnRender: Array<(delta: number) => void>;
  _clickHandlers: Array<(e: MouseEvent) => void>;
  _previousRAF: number | null = null;

  constructor(parentElement?: HTMLElement, width: number = window.innerWidth, height: number = window.innerHeight) {
    THREE.Object3D.DEFAULT_UP.set(0, 0, 1);


    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(width, height);
    (parentElement ?? document.getElementById("app") ?? document.body).appendChild(
      this.renderer.domElement
    );
    this.universalClock = new THREE.Clock();

    this.camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    this.camera.up = new THREE.Vector3(0, 0, 1);
    this.scene = new THREE.Scene();
    this._renderClock = new THREE.Clock();
    this._systems = [];
    this._callOnRender = [];
    this._clickHandlers = [];

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    const element = this.renderer.domElement;

    document.onkeydown = (e) => this.onKeyInput("DOWN", e);
    document.onkeyup = (e) => this.onKeyInput("UP", e);

    element.onclick = (e) => {
      for (let handler of this._clickHandlers) handler(e);
    };
  }

  requestPointerLock(element: HTMLElement): void {
    if (element.requestPointerLock) element.requestPointerLock().catch(() => { });
  }

  public addClickHandler(handler: (event: MouseEvent) => void) {
    this._clickHandlers.push(handler);
  }

  public addContextMenuHandler(handler: (event: MouseEvent) => void): void {
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.addEventListener('contextmenu', handler);
    }
  }

  _animate(): void {
    requestAnimationFrame((t) => {
      if (this._previousRAF == null) {
        this._previousRAF = t;
      }
      this._onrender(t - this._previousRAF);
      this.renderer.render(this.scene, this.camera);
      this._previousRAF = t;
    });
  }

  _onrender(ms: number): void {
    const secs = ms / 1000;
    for (let i = 0; i < this._systems.length; i++) {
      if (this._systems[i]._killSystem) {
        this._systems.splice(i, 1);
        i--;
        continue;
      }
      this._systems[i].step(secs);
    }
    for (let i = 0; i < this._callOnRender.length; i++) {
      this._callOnRender[i](secs);
    }
    this.controls.update();
    this._animate();
  }

  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  addSystem(system: System): void {
    this._systems.push(system);
  }

  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }
}

export abstract class System {
  abstract step(delta: number): void;
  _killSystem: boolean = false;
}

export { World };
