import * as THREE from "three";
import type { System, World } from "./world";
import { OrbitControls, Sky } from "three/examples/jsm/Addons.js";

export class View3D implements System {
    private currentQuaternion: THREE.Quaternion;
    private object: THREE.Mesh;
    private controls: OrbitControls;
    public _killSystem: boolean = false;

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
    }

    step(delta: number): void {
        this.controls.update();
    }

    private getObject(): THREE.Mesh {
        const geom = new THREE.BoxGeometry(1, 0.1, 1);
        const mat = new THREE.MeshBasicMaterial({ color: '#5ab862' });
        const mesh = new THREE.Mesh(geom, mat);
        return mesh;
    }

    private getAxesHelper(): THREE.AxesHelper {
        const axesHelper = new THREE.AxesHelper(2);
        return axesHelper;
    }

    private getReferencePlane(): THREE.Mesh {
        const planeImage = new THREE.TextureLoader().load('app/three-utils/referencePlane.png');
        const geom = new THREE.PlaneGeometry(10, 10);
        const mat = new THREE.MeshBasicMaterial({ map: planeImage });
        const plane = new THREE.Mesh(geom, mat);
        return plane;
    }

    private initSky() {

        const sky = new Sky();
        sky.scale.setScalar(10000);
        this.world.scene.add(sky);

        const effectController = {
            turbidity: 10,
            rayleigh: 3,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: 2,
            azimuth: 180,
            exposure: this.world.renderer.toneMappingExposure
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

        this.world.renderer.toneMappingExposure = effectController.exposure;
    }

    public setQuaternion(x: number, y: number, z: number, w: number): void {
        this.currentQuaternion.set(x, y, z, w);
        this.object.setRotationFromQuaternion(this.currentQuaternion);
        this.object.matrixWorldNeedsUpdate = true;
    }
}