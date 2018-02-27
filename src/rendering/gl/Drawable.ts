import {mat3, mat4, vec3, vec4} from 'gl-matrix';
import {gl} from '../../globals';

abstract class Drawable {
  count: number = 0;

  bufIdx: WebGLBuffer;
  bufPos: WebGLBuffer;
  bufNor: WebGLBuffer;
  bufCol: WebGLBuffer;
  bufUV: WebGLBuffer;

  idxBound: boolean = false;
  posBound: boolean = false;
  norBound: boolean = false;
  colBound: boolean = false;
  uvBound: boolean = false;

  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  cols: Float32Array;
  uvs: Float32Array;


  center: vec4;
  
  diffuseMap: WebGLTexture;
  diffuseMapBound: boolean = false;

  NoiseMap: WebGLTexture;
  NoiseMapBound: boolean = false;

  EnvMap: WebGLTexture;
  EnvMapBound: boolean = false;

  modelMat: mat4 = mat4.create();
  transMat: mat4 = mat4.create();
  rotMat: mat4 = mat4.create();
  scaleMat: mat4 = mat4.create();

  InverseTransMat: mat4 = mat4.create();

  indicesArray : Array<number> = [];
  positionsArray : Array<number> = [];
  colsArray : Array<number> = [];
  normalsArray : Array<number> = [];
  uvsArray : Array<number> = [];

  abstract create() : void;

  updatePos(deltaPos:vec3)
  {
    mat4.translate(this.modelMat, this.modelMat, deltaPos);
  }

  updateNewPos(absPos:vec3)
  {
    let tranMat = mat4.create();
    mat4.translate(this.transMat, tranMat, absPos);
  }

  updateScale(newScale:vec3)
  {
    let sMat = mat4.create();
    mat4.scale(this.scaleMat, sMat, newScale);
  }

  updateRotY(rad:number)
  {
    let rotMat = mat4.create();
    mat4.rotateY(this.rotMat, rotMat, rad);
  }
  
  updateInvTrans()
  {
    let tempMat = mat3.create();

    tempMat[0] = this.modelMat[0];
    tempMat[1] = this.modelMat[1];
    tempMat[2] = this.modelMat[2];

    tempMat[3] = this.modelMat[4];
    tempMat[4] = this.modelMat[5];
    tempMat[5] = this.modelMat[6];

    tempMat[6] = this.modelMat[8];
    tempMat[7] = this.modelMat[9];
    tempMat[8] = this.modelMat[10];

    let invTempMat = mat3.create();
    mat3.invert(invTempMat, tempMat);
    mat3.transpose(tempMat, invTempMat);

    this.InverseTransMat[0] = tempMat[0];
    this.InverseTransMat[1] = tempMat[1];
    this.InverseTransMat[2] = tempMat[2];
    this.InverseTransMat[3] = 0;

    this.InverseTransMat[4] = tempMat[3];
    this.InverseTransMat[5] = tempMat[4];
    this.InverseTransMat[6] = tempMat[5];
    this.InverseTransMat[7] = 0;

    this.InverseTransMat[8] = tempMat[6];
    this.InverseTransMat[9] = tempMat[7];
    this.InverseTransMat[10] = tempMat[8];
    this.InverseTransMat[11] = 0;

    this.InverseTransMat[12] = 0;
    this.InverseTransMat[13] = 0;
    this.InverseTransMat[14] = 0;
    this.InverseTransMat[15] = 1;
  }

  createInvTrans(modelMat: mat4): mat4
  {
    let tempMat = mat3.create();

    tempMat[0] = modelMat[0];
    tempMat[1] = modelMat[1];
    tempMat[2] = modelMat[2];

    tempMat[3] = modelMat[4];
    tempMat[4] = modelMat[5];
    tempMat[5] = modelMat[6];

    tempMat[6] = modelMat[8];
    tempMat[7] = modelMat[9];
    tempMat[8] = modelMat[10];

    let invTempMat = mat3.create();
    mat3.invert(invTempMat, tempMat);
    mat3.transpose(tempMat, invTempMat);

    let InverseTransMat = mat4.create();

    InverseTransMat[0] = tempMat[0];
    InverseTransMat[1] = tempMat[1];
    InverseTransMat[2] = tempMat[2];
    InverseTransMat[3] = 0;

    InverseTransMat[4] = tempMat[3];
    InverseTransMat[5] = tempMat[4];
    InverseTransMat[6] = tempMat[5];
    InverseTransMat[7] = 0;

    InverseTransMat[8] = tempMat[6];
    InverseTransMat[9] = tempMat[7];
    InverseTransMat[10] = tempMat[8];
    InverseTransMat[11] = 0;

    InverseTransMat[12] = 0;
    InverseTransMat[13] = 0;
    InverseTransMat[14] = 0;
    InverseTransMat[15] = 1;

    return InverseTransMat;
  }

  mulMat4Vec4(inMat:mat4, inVec:vec4): vec4
  {
    var outVec = vec4.create();

    vec4.fromValues(inMat[0], inMat[4], inMat[8], inMat[12]);

    outVec[0] = inMat[0] * inVec[0] + inMat[4] * inVec[1] + inMat[8] * inVec[2] + inMat[12] * inVec[3];
    outVec[1] = inMat[1] * inVec[0] + inMat[5] * inVec[1] + inMat[9] * inVec[2] + inMat[13] * inVec[3];
    outVec[2] = inMat[2] * inVec[0] + inMat[6] * inVec[1] + inMat[10] * inVec[2] + inMat[14] * inVec[3];
    outVec[3] = inMat[3] * inVec[0] + inMat[7] * inVec[1] + inMat[11] * inVec[2] + inMat[15] * inVec[3];

    return outVec;
  }

  updateModelMat()
  {
    let sr = mat4.create();
    mat4.multiply(sr, this.scaleMat, this.transMat );
    mat4.multiply(this.modelMat, sr, this.rotMat );
    this.updateInvTrans();
  }

  updateModelMat2(modelMatParam:mat4)
  {
    this.modelMat = modelMatParam;
    this.updateInvTrans();
  }
  

  destory() {
    gl.deleteBuffer(this.bufIdx);
    gl.deleteBuffer(this.bufPos);
    gl.deleteBuffer(this.bufNor);
    gl.deleteBuffer(this.bufCol);
    gl.deleteBuffer(this.bufUV);

    /*
    if(this.diffuseMapBound)
    gl.deleteTexture(this.diffuseMap);

    if(this.norBound)
    gl.deleteTexture(this.NoiseMap);

    if(this.EnvMapBound)
    gl.deleteTexture(this.EnvMap);    

    this.diffuseMapBound = false;
    this.norBound = false;
    this.EnvMapBound = false;
    */
  }

  generateIdx() {
    this.idxBound = true;
    this.bufIdx = gl.createBuffer();
  }

  generatePos() {
    this.posBound = true;
    this.bufPos = gl.createBuffer();
  }

  generateNor() {
    this.norBound = true;
    this.bufNor = gl.createBuffer();
  }

  generateCol() {
    this.colBound = true;
    this.bufCol = gl.createBuffer();
  }

  generateUV() {
    this.uvBound = true;
    this.bufUV = gl.createBuffer();
  }

  bindIdx(): boolean {
    if (this.idxBound) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    }
    return this.idxBound;
  }

  bindPos(): boolean {
    if (this.posBound) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    }
    return this.posBound;
  }

  bindNor(): boolean {
    if (this.norBound) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    }
    return this.norBound;
  }

  bindCol(): boolean {
    if (this.colBound) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    }
    return this.colBound;
  }

  bindUV(): boolean {
    if (this.uvBound) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV);
    }
    return this.uvBound;
  }
  
  bindTexture(url:string)
  {   
    this.diffuseMapBound = true;
    const texture = gl.createTexture();

    const image = new Image();
    image.onload = function()
    { 
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    image.src = url;
    this.diffuseMap = texture;
  }

  bindTexture01(url:string)
  {   
    this.NoiseMapBound = true;
    const texture = gl.createTexture();

    const image = new Image();
    image.onload = function()
    { 
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    image.src = url;
    this.NoiseMap = texture;
  }

  bindTexture02(url:string)
  {  
    this.EnvMapBound = true; 
    const texture = gl.createTexture();

    const image = new Image();
    image.onload = function()
    { 
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    image.src = url;
    this.EnvMap = texture;
  }

  elemCount(): number {
    return this.count;
  }

  drawMode(): GLenum {
    return gl.TRIANGLES;
  }
};

export default Drawable;
