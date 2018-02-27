import * as CameraControls from '3d-view-controls';
import {vec3, mat4} from 'gl-matrix';

class Camera {
  controls: any;
  projectionMatrix: mat4 = mat4.create();
  viewMatrix: mat4 = mat4.create();
  fovy: number = 45;
  aspectRatio: number = 1;
  near: number = 0.1;
  far: number = 1000;
  position: vec3 = vec3.create();
  direction: vec3 = vec3.create();
  target: vec3 = vec3.create();
  up: vec3 = vec3.create();

  constructor(position: vec3, target: vec3) {
    this.controls = CameraControls(document.getElementById('canvas'), {
      eye: position,
      center: target,
    });
    vec3.add(this.target, this.position, this.direction);
    mat4.lookAt(this.viewMatrix, this.controls.eye, this.controls.center, this.controls.up);
  }

  setAspectRatio(aspectRatio: number) {
    this.aspectRatio = aspectRatio;
  }

  updateProjectionMatrix() {
    mat4.perspective(this.projectionMatrix, this.fovy, this.aspectRatio, this.near, this.far);
  }

  update() {
    this.controls.tick();
    vec3.add(this.target, this.position, this.direction);

    var localUp = vec3.fromValues(0.0, 1.0, 0.0);    
    var viewVec = vec3.fromValues(0.0, 0.0, 0.0);    
    vec3.subtract(viewVec, this.controls.eye, this.controls.center);
    vec3.normalize(viewVec, viewVec);

    //console.log(this.controls.eye);

    if(vec3.dot(localUp, viewVec) > 0.999 )
      this.controls.up = localUp = vec3.fromValues(0.0, 0.0, -1.0);
    else
      this.controls.up = localUp;

    mat4.lookAt(this.viewMatrix, this.controls.eye, this.controls.center, this.controls.up);

    this.position = this.controls.eye;
    this.up = this.controls.up;
  }
};

export default Camera;
