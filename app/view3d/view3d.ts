import * as THREE from "three";
import type { System, World } from "./world";
import { GLTFLoader, OrbitControls, Sky } from "three/examples/jsm/Addons.js";

export class View3D implements System {
    private currentQuaternion: THREE.Quaternion;
    private object: THREE.Object3D;
    private controls: OrbitControls;
    public _killSystem: boolean = false;
    private rawQuaternion = new THREE.Quaternion();
    private zeroQuaternion = new THREE.Quaternion();
    private currentPosition = new THREE.Vector3();
    private lastPosition!: THREE.Vector3;
    private movementEnabled: boolean = false;

    constructor(private world: World) {
        this.currentQuaternion = new THREE.Quaternion();

        const object = this.getObject();
        object.position.set(0, 0, 0);
        this.world.scene.add(object);
        this.object = object;

        const axes = this.getAxesHelper();
        object.add(axes);

        this.controls = new OrbitControls(this.world.camera, this.world.renderer.domElement);
        this.world.camera.position.set(0, 5, 5);

        const referencePlane = this.getReferencePlane();
        referencePlane.position.set(0, 0, -5);
        this.world.scene.add(referencePlane);

        this.initSky();

        const light = this.getAmbientLight();
        this.world.add(light);

        const mainAxes = this.getAxesHelper();
        mainAxes.position.set(0, 0, -5);
        this.world.scene.add(mainAxes);

        this.world.renderer.domElement.style.borderRadius = '5px';
    }

    step(): void {
        this.controls.update();
    }

    private getObject(): THREE.Object3D {
        const base = new THREE.Object3D();

        const loader = new GLTFLoader();
        loader.load('app/view3d/firm_model.glb', (gltf) => {
            const model = gltf.scene.children[0];
            model.scale.set(0.1, 0.1, 0.1);
            base.add(model);
        });

        return base;
    }

    private getAxesHelper(scale: number = 2): THREE.AxesHelper {
        const axesHelper = new THREE.AxesHelper(scale);
        return axesHelper;
    }

    private getReferencePlane(): THREE.Mesh {
        const planeImage = new THREE.TextureLoader().load('app/view3d/Protractor.png');
        const geom = new THREE.PlaneGeometry(10, 10);
        const mat = new THREE.MeshBasicMaterial({ map: planeImage });
        const plane = new THREE.Mesh(geom, mat);
        return plane;
    }

    private getAmbientLight(): THREE.AmbientLight {
        const light = new THREE.AmbientLight('#ffffff', 20);
        return light;
    }

    private initSky() {

        const sky = new Sky();
        sky.scale.setScalar(10000);
        this.world.scene.add(sky);

        const effectController = {
            turbidity: 0.5,
            rayleigh: 3.508,
            mieCoefficient: 0.016,
            mieDirectionalG: 0.7,
            elevation: 63.5,
            azimuth: 7.4,
            exposure: 0.14
        };

        const uniforms = sky.material.uniforms;
        uniforms['turbidity'].value = effectController.turbidity;
        uniforms['rayleigh'].value = effectController.rayleigh;
        uniforms['mieCoefficient'].value = effectController.mieCoefficient;
        uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;
        uniforms['up'].value.set(0, 0, 1);

        const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
        const theta = THREE.MathUtils.degToRad(effectController.azimuth);

        const sun = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);

        uniforms['sunPosition'].value.copy(sun);

        this.world.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.world.renderer.toneMappingExposure = effectController.exposure;
    }

    public setQuaternion(x: number, y: number, z: number, w: number): void {
        this.rawQuaternion.set(x, y, z, w);
        this.currentQuaternion.copy(this.zeroQuaternion).multiply(this.rawQuaternion);
        this.object.quaternion.copy(this.currentQuaternion);
    }

    public setPosition(x: number, y: number, z: number): void {

        if (!this.movementEnabled) { return; }

        if (this.lastPosition == null) {
            this.lastPosition = new THREE.Vector3(x, y, z);
        }

        this.currentPosition = new THREE.Vector3(x, y, z).sub(this.lastPosition);

        this.object.position.copy(this.currentPosition);
    }

    public setMovementEnabled(enabled: boolean): void {

        if (!enabled) {
            this.object.position.set(0, 0, 0);
        }

        this.movementEnabled = enabled;
    }

    public zero(): void {
        this.zeroQuaternion.copy(this.rawQuaternion).invert();
    }
}