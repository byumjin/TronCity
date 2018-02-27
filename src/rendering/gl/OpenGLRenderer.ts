import {mat4, vec2, vec4} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
  constructor(public canvas: HTMLCanvasElement) {
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>, timeInfo: vec2) {
    
    let viewProj = mat4.create();
   
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    
    prog.setViewProjMatrix(viewProj);

    let invViewProj = mat4.create();

    mat4.invert(invViewProj, viewProj);

    prog.setinvViewProjMatrix(invViewProj);
    
    prog.setCameraPos( vec4.fromValues(camera.position[0], camera.position[1], camera.position[2], 1.0));
    prog.setTimeInfo(timeInfo);


    for (let drawable of drawables) {      
      if(drawable.diffuseMapBound)
        prog.setTexture(drawable.diffuseMap);

      if(drawable.NoiseMapBound)
        prog.setTexture01(drawable.NoiseMap);

      if(drawable.EnvMapBound)
        prog.setTexture02(drawable.EnvMap);
      
      prog.setModelMatrix(drawable.modelMat);
      prog.draw(drawable);
    }
  }
};

export default OpenGLRenderer;
