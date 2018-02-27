import * as WEBGLOBJLOADER from 'webgl-obj-loader';
import {vec3, vec4, mat4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class TriCube_Roof_00 extends Drawable {
  
  constructor(center: vec3) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
  }

  create()
  {
    console.log("cube created");
    mat4.identity(this.modelMat);

    var outResult;
    let errMsg : string;

    let posArray : Array<number>;
    posArray = [];
    let norArray : Array<number>;
    norArray = [];
    let indexArray : Array<number>;
    indexArray = [];
    let uvArray : Array<number>;
    uvArray = [];

    let bLoaded = false;
        
    var objStr = document.getElementById('cube.obj').innerHTML;
    var mesh = new WEBGLOBJLOADER.Mesh(objStr);

    posArray = mesh.vertices;
    norArray = mesh.vertexNormals;
    indexArray = mesh.indices;
    uvArray  = mesh.textures;

    this.positions = new Float32Array(posArray);
    this.normals = new Float32Array(norArray);
    this.indices = new Uint32Array(indexArray);
    this.uvs = new Float32Array(uvArray);
  }

  createdByLoader( stringParam : string )
  {
    console.log("TriCube_Roof_00 created");
    mat4.identity(this.modelMat);

    var outResult;
    let errMsg : string;

    let posArray : Array<number>;
    posArray = [];
    let norArray : Array<number>;
    norArray = [];
    let indexArray : Array<number>;
    indexArray = [];
    let uvArray : Array<number>;
    uvArray = [];


    let bLoaded = false;
    var mesh = new WEBGLOBJLOADER.Mesh(stringParam);
    
    posArray = mesh.vertices;
    norArray = mesh.vertexNormals;
    indexArray = mesh.indices;
    uvArray  = mesh.textures;

    this.positions = new Float32Array(posArray);
    this.normals = new Float32Array(norArray);
    this.indices = new Uint32Array(indexArray);
    this.uvs = new Float32Array(uvArray);
  }
};

export default TriCube_Roof_00;
