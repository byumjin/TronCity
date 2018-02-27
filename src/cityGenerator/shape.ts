import {vec2, vec3, vec4, mat3, mat4} from 'gl-matrix';
import {gl} from '../globals';
import Drawable from '../rendering/gl/Drawable';

import Cylinder from '../geometry/Cylinder';

import Cube from '../geometry/Cube';
import Cube_Outter from '../geometry/Cube_Outter';
import Cube_Roof from '../geometry/Cube_Roof';

import HexaCube from '../geometry/HexaCube';
import HexaCube_Outter from '../geometry/HexaCube_Outter';
import HexaCube_Roof from '../geometry/HexaCube_Roof';

import TriCube from '../geometry/TriCube';
import TriCube_Outter from '../geometry/TriCube_Outter';
import TriCube_Roof_00 from '../geometry/TriCube_Roof_00';
import TriCube_Roof_01 from '../geometry/TriCube_Roof_01';
import { truncateSync } from 'fs';

import Perlin from './perlin';

class Shape{
 
  symbol: string;
  geometry: string;
  position: vec3;
  rotation: vec3;
  scale: vec3;
  top: boolean;
  terminal: boolean;
  index: number;

  constructor(symbol:string, geometry:string, position:vec3, rotation:vec3, scale:vec3, top:boolean, terminal:boolean, index:number) {   
    
    this.symbol = symbol;
    this.geometry = geometry;
    this.position = position;
    this.rotation = rotation;//vec3.fromValues(0, 0, 0);
    this.scale = scale;//vec3.fromValues(1, 1, 1);
    this.top = top;
    this.terminal = terminal;
    this.index = index;
  }
};



class ShapeManager extends Drawable
{
  shapes: Array<Shape>;
  Iteration : number;
  mapSize : number;

  //per Shape
  classStack: Array<number> = [];
  meshStack: Array<Drawable> = [];
  modelMatstack: Array<mat4> = [];
  InvTranseMatstack: Array<mat4> = [];

  //using meshes
  cube : Cube;
  cube_Outter : Cube_Outter;
  cube_Roof : Cube_Roof;

  cylinder : Cylinder;

  hexaCube : HexaCube;
  hexaCube_Outter : HexaCube_Outter;
  hexaCube_Roof : HexaCube_Roof;

  triCube : TriCube;
  triCube_Outter : TriCube_Outter;
  triCube_Roof_00 : TriCube_Roof_00;
  triCube_Roof_01 : TriCube_Roof_01;

  DegreeToRadian : number;

  perlinGenerator: Perlin;

  crowdedPopulation : number;

  highWayGrid : any;

  constructor()
  {   
    super();
    
    this.DegreeToRadian = 0.01745329251994329576923690768489;
    this.crowdedPopulation = 0.8;
    this.mapSize = 2;
    
  }

  clear()
  {
    this.destory();
    
    this.modelMat = mat4.create();
    mat4.identity(this.modelMat);

    this.transMat = mat4.create();
    mat4.identity(this.transMat);

    this.rotMat = mat4.create();
    mat4.identity(this.rotMat);

    this.scaleMat = mat4.create();
    mat4.identity(this.scaleMat);

    
    this.meshStack = [];
    this.classStack = [];
    this.modelMatstack = [];
    this.InvTranseMatstack = [];

    this.indicesArray = [];
    this.positionsArray = [];
    this.colsArray = [];
    this.normalsArray = [];
    this.uvsArray = [];

    
  }

  create() {
    
    this.Iteration = 0;
    this.clear();

    this.perlinGenerator = new Perlin;

    

  }

  bindBuffers()
  {
    let startIndex: number;
    startIndex = 0;

    //merge all VBO data
    for(let m  = 0; m < this.meshStack.length; m++)
    {    
      var thisMesh = this.meshStack[m];
      var thisModelMat = this.modelMatstack[m];
      var thisInvTransMat = this.InvTranseMatstack[m];
      var classIndex = this.classStack[m];

      var randomSeed = Math.random();

      for(let i  = 0; i < thisMesh.positions.length / 3; i++)
      { 
        let newPos : vec4;
        newPos = vec4.create();     
        newPos = this.mulMat4Vec4(thisModelMat, vec4.fromValues(thisMesh.positions[i*3], thisMesh.positions[i*3 + 1], thisMesh.positions[i*3 + 2], 1.0));
          

        this.positionsArray.push( newPos[0] );
        this.positionsArray.push( newPos[1] );
        this.positionsArray.push( newPos[2] );
        this.positionsArray.push( newPos[3] );

        if(classIndex == 0)
        {
          this.colsArray.push( 0.1 ); //x   
          this.colsArray.push( 0.1 ); //y    
          this.colsArray.push( 0.1 ); //z   
          this.colsArray.push( 0.0 ); //w  
        }
        else if(classIndex == 1)
        {
          this.colsArray.push( 0.40392 ); //x   
          this.colsArray.push( 0.94509 ); //y    
          this.colsArray.push( 0.98 ); //z  
          this.colsArray.push( 1.0 + randomSeed ); //w   
        }
        else if(classIndex == 2)
        {
          this.colsArray.push( 1.0 ); //x   
          this.colsArray.push( 0.5  ); //y    
          this.colsArray.push( 0.0  ); //z  
          this.colsArray.push( 1.0 + randomSeed ); //w   
        }
        else if(classIndex == 3)
        {
          this.colsArray.push( 1.0 ); //x   
          this.colsArray.push( 0.2 ); //y    
          this.colsArray.push( 0.1 ); //z  
          this.colsArray.push( 1.0 + randomSeed ); //w
        }
      }      

      for(let i  = 0; i < thisMesh.normals.length / 3; i++)
      { 
        let newNor : vec4;
        newNor = vec4.create();
        newNor = this.mulMat4Vec4(thisInvTransMat, vec4.fromValues(thisMesh.normals[i*3], thisMesh.normals[i*3 + 1], thisMesh.normals[i*3 + 2], 0.0));

        this.normalsArray.push( newNor[0] );
        this.normalsArray.push( newNor[1] );
        this.normalsArray.push( newNor[2] );
        this.normalsArray.push( newNor[3] );
      }   
      
      //console.log(thisMesh.uvs.length);
      for(let i  = 0; i < thisMesh.uvs.length / 2; i++)
      { 
        this.uvsArray.push( thisMesh.uvs[i*2] );
        this.uvsArray.push( thisMesh.uvs[i*2 + 1] );
      } 
      
      //console.log(this.uvsArray);

      let max : number = 0;
      for(let i  = 0; i < thisMesh.indices.length; i++)
      {      
        var thisIndex =  thisMesh.indices[i];
        if(max < thisIndex)
        {
          max = thisIndex;
        }
        this.indicesArray.push( thisIndex + startIndex );
      }
      startIndex += (max + 1);
    } 

    this.indices = new Uint32Array(this.indicesArray); 
    this.normals = new Float32Array(this.normalsArray);
    this.positions = new Float32Array(this.positionsArray);
    this.cols = new Float32Array(this.colsArray);
    this.uvs = new Float32Array(this.uvsArray);

    this.generateIdx();
    this.generatePos();
    this.generateNor();
    this.generateCol();
    this.generateUV();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, this.cols, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);

    console.log(`finished bindBuffers`);
  }

  getMeshes(cube :Cube, cube_Outter : Cube_Outter, cube_Roof : Cube_Roof, cylinder : Cylinder, hexaCube : HexaCube,  hexaCube_Outter : HexaCube_Outter, hexaCube_Roof : HexaCube_Roof, triCube : TriCube, triCube_Outter : TriCube_Outter,
    triCube_Roof_00 : TriCube_Roof_00, triCube_Roof_01 : TriCube_Roof_01)
  {
    this.cube = cube;
    this.cube_Outter = cube_Outter;
    this.cube_Roof = cube_Roof;

    this.cylinder = cylinder;
  
    this.hexaCube = hexaCube;
    this.hexaCube_Outter = hexaCube_Outter;
    this.hexaCube_Roof = hexaCube_Roof;

    this.triCube = triCube;
    this.triCube_Outter = triCube_Outter;
    this.triCube_Roof_00 = triCube_Roof_00;
    this.triCube_Roof_01 = triCube_Roof_01;
  }

  update(iter: number, mapSize: number, densePopulationCap: number)
  {
    this.Iteration = iter;
    this.mapSize = mapSize;
    this.crowdedPopulation = densePopulationCap;
  }

  generateCity()
  {    

    this.highWayGrid = new Array(this.mapSize);
    
    for(var i = 0; i < this.highWayGrid.length; i++)
    {
      this.highWayGrid[i] = new Array(this.mapSize);

      for(var j = 0; j < this.highWayGrid[i].length; j++)
      {
        this.highWayGrid[i][j] = 0;
      }
    }

    for(var i = 0 ; i < this.mapSize / 20; i++)
    {
      this.highWayGenerator();
    }

    this.shapes = [];

    let firstShape: Shape;
    //var mapSize = 18;

    var unifromScale = 0.5;

    let perlinResult: Array<number> = [];

    var min = 10.0;
    var max = -10.0;
    var index = 0;

    var halfMapSize = this.mapSize / 2;

    for(var x = -halfMapSize; x < halfMapSize; x++)
    {
      for(var z = -halfMapSize; z < halfMapSize; z++)
      {
        var prob = Math.random();
        if(prob < 0.4)
        {
          firstShape = new Shape("Floor", "Cube", vec3.fromValues(x, 0, z), vec3.fromValues(0, 0, 0), vec3.fromValues(unifromScale, unifromScale, unifromScale), true, false, index);
          this.shapes.push( firstShape );
        }
        else if(prob < 0.75)
        {
          firstShape = new Shape("Floor", "HexaCube", vec3.fromValues(x, 0, z), vec3.fromValues(0, 0, 0), vec3.fromValues(unifromScale, unifromScale, unifromScale), true, false, index);
          this.shapes.push( firstShape );
        }
        else
        {
          firstShape = new Shape("Floor", "TriCube", vec3.fromValues(x, 0, z), vec3.fromValues(0, 0, 0), vec3.fromValues(unifromScale, unifromScale, unifromScale), true, false, index);
          this.shapes.push( firstShape );
        } 

        index++;
      }
    }

    this.perlinGenerator.originalPerlinNoise2D(this.mapSize);

    for(var i = 0; i < this.mapSize; i++)
    {
      for(var j = 0; j < this.mapSize; j++)
      {
        if(i == 0 || i == this.mapSize - 1 || j == 0 || j == this.mapSize - 1)        
          perlinResult.push(this.perlinGenerator.perlinNoiseBuffer[i][j] * 0.6);
        else
          perlinResult.push(this.perlinGenerator.perlinNoiseBuffer[i][j]);

      }
    }

    this.parseShapeGrammer(this.shapes, perlinResult, this.Iteration);

    for(var i = 0; i<this.shapes.length; i++)
    {
      let tempModelMat = mat4.create();
      mat4.identity(tempModelMat);
      
      mat4.translate(tempModelMat, tempModelMat, this.shapes[i].position );

      mat4.rotateX(tempModelMat, tempModelMat, this.shapes[i].rotation[0] * this.DegreeToRadian );
      mat4.rotateY(tempModelMat, tempModelMat, this.shapes[i].rotation[1] * this.DegreeToRadian );
      mat4.rotateZ(tempModelMat, tempModelMat, this.shapes[i].rotation[2] * this.DegreeToRadian );     

      mat4.scale(tempModelMat, tempModelMat, this.shapes[i].scale);   
      
      var geoType = this.shapes[i].geometry;
      var symbolType = this.shapes[i].symbol;

      //0 : black
      //1 : light blue
      //2 : orange

      if(geoType == "Cube")
      {
       this.meshStack.push(this.cube);

       if(symbolType == "Outter" || symbolType == "Deco")
        this.classStack.push(1);
       else if(symbolType == "Road")
        this.classStack.push(3);
       else if(symbolType == "Inner")
        this.classStack.push(1);
       else
        this.classStack.push(0);
      }
      else if(geoType == "Cube_Outter")
      {
       this.meshStack.push(this.cube_Outter);
       this.classStack.push(0);
      }
      else if(geoType == "Cube_Roof")
      {
       this.meshStack.push(this.cube_Roof);
       this.classStack.push(0);
      }
      else if(geoType == "HexaCube")
      {
       this.meshStack.push(this.hexaCube);

       if(symbolType == "Outter" || symbolType == "Deco")
        this.classStack.push(1);
       else if(symbolType == "Inner")
        this.classStack.push(1);
       else
        this.classStack.push(0);
      }
      else if(geoType == "HexaCube_Outter")
      {
       this.meshStack.push(this.hexaCube_Outter);
       this.classStack.push(0);
      }
      else if(geoType == "HexaCube_Roof")
      {
       this.meshStack.push(this.hexaCube_Roof);
       this.classStack.push(0);
      }
      else if(geoType == "TriCube")
      {
       this.meshStack.push(this.triCube);
       
       if(symbolType == "Outter" || symbolType == "Deco")
        this.classStack.push(1);
       else if(symbolType == "Inner")
        this.classStack.push(1);
       else
        this.classStack.push(0);        
      }
      else if(geoType == "TriCube_Outter")
      {
       this.meshStack.push(this.triCube_Outter);
       this.classStack.push(0);
      }
      else if(geoType == "TriCube_Roof_00")
      {
       this.meshStack.push(this.triCube_Roof_00);
       this.classStack.push(0);
      }
      else if(geoType == "TriCube_Roof_01")
      {
       this.meshStack.push(this.triCube_Roof_01);
       this.classStack.push(0);
      }

      if(perlinResult[this.shapes[i].index] > this.crowdedPopulation  && this.classStack[this.classStack.length-1] == 1)
      {
        this.classStack[this.classStack.length-1] = 2;
      }

      this.modelMatstack.push(tempModelMat);
      this.InvTranseMatstack.push(this.createInvTrans(tempModelMat));
    }
  }

  AddRoad00(shape: Shape, bCross : boolean, bTerminal : boolean) : Array<Shape>
  {
    let newShapes: Array<Shape>;
    newShapes = [];

    var geoType = "Cube";

    //base
    if(bCross)
    newShapes.push( new Shape(shape.symbol, geoType, vec3.fromValues(shape.position[0],shape.position[1] + 1.5, shape.position[2]), shape.rotation, vec3.fromValues( 1.0, 0.2, 1.0), false, true, shape.index));
    else
    newShapes.push( new Shape(shape.symbol, geoType, vec3.fromValues(shape.position[0], shape.position[1] + 1.5, shape.position[2]), shape.rotation, vec3.fromValues( Math.random() * 0.3 + 0.65, 0.2, 1.0), false, true, shape.index));

    //SideLight
    newShapes.push( new Shape("Road", geoType, vec3.fromValues(shape.position[0] - 0.3, shape.position[1] + 1.61, shape.position[2]),
     shape.rotation, vec3.fromValues( 0.03, 0.025, 1.0), false, true, shape.index));

    newShapes.push( new Shape("Road", geoType, vec3.fromValues(shape.position[0] + 0.3, shape.position[1] + 1.61, shape.position[2]),
     shape.rotation, vec3.fromValues( 0.03, 0.025, 1.0), false, true, shape.index));

    return newShapes;
  }

  AddRoad01(shape: Shape, bCross : boolean, bTerminal : boolean) : Array<Shape>
  {
    let newShapes: Array<Shape>;
    newShapes = [];

    var geoType = "Cube";

    //base
    if(bCross)
    newShapes.push( new Shape(shape.symbol, geoType, vec3.fromValues(shape.position[0],shape.position[1] + 1.5, shape.position[2]), shape.rotation, vec3.fromValues( 1.0, 0.2, 1.0), false, true, shape.index));
    else
    newShapes.push( new Shape(shape.symbol, geoType, vec3.fromValues(shape.position[0],shape.position[1] + 1.5, shape.position[2]), shape.rotation, vec3.fromValues( 1.0, 0.2, Math.random() * 0.3 + 0.65), false, true, shape.index));

    //SideLight
    newShapes.push( new Shape("Road", geoType, vec3.fromValues(shape.position[0], shape.position[1] + 1.61, shape.position[2] - 0.3),
     shape.rotation, vec3.fromValues( 1.0, 0.025, 0.03), false, true, shape.index));

    newShapes.push( new Shape("Road", geoType, vec3.fromValues(shape.position[0], shape.position[1] + 1.61, shape.position[2] + 0.3),
     shape.rotation, vec3.fromValues( 1.0, 0.025, 0.03), false, true, shape.index));

    return newShapes;
  }

  AddOutter(shape: Shape, innerScale:number, bTerminal : boolean) : Array<Shape>
  {
    let newShapes: Array<Shape>;
    newShapes = [];

    var symbol = "Outter";

    newShapes.push( new Shape(symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0] * innerScale, shape.scale[1] * innerScale, shape.scale[2] * innerScale), false, true, shape.index));
    
    let OutterGeo : string;

    if(shape.geometry == "Cube" )
      OutterGeo = "Cube_Outter";
    else if(shape.geometry == "HexaCube" )
      OutterGeo = "HexaCube_Outter";
    else if(shape.geometry == "TriCube" )
      OutterGeo = "TriCube_Outter";
    else
    {
      console.log("error : " + shape.geometry);
      return newShapes;
    }

    if(OutterGeo != "TriCube_Outter")
      newShapes.push( new Shape("Inner", OutterGeo, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2]),
      vec3.fromValues(shape.rotation[0], Math.random() < 0.5 ? shape.rotation[1] : shape.rotation[1] + 180, shape.rotation[2]), vec3.fromValues(shape.scale[0], shape.scale[1], shape.scale[2]), false, bTerminal, shape.index));
    else
      newShapes.push( new Shape("Inner", OutterGeo, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2]),
      vec3.fromValues(shape.rotation[0], shape.rotation[1], shape.rotation[2]), vec3.fromValues(shape.scale[0], shape.scale[1], shape.scale[2]), false, bTerminal, shape.index));
   
      let newShapes2: Array<Shape>;
    let newShapes3: Array<Shape>;
    newShapes3 = [];

    for(var i = 0 ; i < newShapes.length; i++)
    {
      if(Math.random() < 0.1)
      {
        newShapes2 = [];
        newShapes2 = this.rules_Deco(newShapes[i]);

        for(var j = 0 ; j < newShapes2.length; j++)
        {
          newShapes3.push(newShapes2[j]);
        }
      }
      else
      {
        newShapes[i].terminal = true;
        newShapes3.push(newShapes[i]);
      }
    }
    
    newShapes = [];
    
    return newShapes3;
  }

  AddOutter02(shape: Shape, innerScale:number, bTerminal : boolean) : Array<Shape>
  {
    let newShapes: Array<Shape>;
    newShapes = [];

    var symbol = "Outter";

    newShapes.push( new Shape("Inner", shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0] * innerScale, shape.scale[1], shape.scale[2] * innerScale), false, true, shape.index)); // inner
    newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1]* innerScale, shape.scale[2]), false, bTerminal, shape.index)); //outter
    
    let newShapes2: Array<Shape>;
    let newShapes3: Array<Shape>;
    newShapes3 = [];

    for(var i = 0 ; i < newShapes.length; i++)
    {
      if(Math.random() < 0.1)
      {
        newShapes2 = [];
        newShapes2 = this.rules_Deco(newShapes[i]);

        for(var j = 0 ; j < newShapes2.length; j++)
        {
          newShapes3.push(newShapes2[j]);
        }
      }
      else
      {
        newShapes[i].terminal = true;
        newShapes3.push(newShapes[i]);
      }
    }
    
    newShapes = [];

    return newShapes3;
  }

  AddDeco(shape: Shape, maxDeco:number, bTerminal : boolean) : Array<Shape>
  {
    let newShapes: Array<Shape>;
    newShapes = [];

    newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1], shape.scale[2]), false, true, shape.index));

    let OutterGeo : string;

    if(shape.geometry == "Cube" || shape.geometry == "Cube_Outter" )
      OutterGeo = "Cube";
    else if(shape.geometry == "TriCube" || shape.geometry == "TriCube_Outter" )
      OutterGeo = "TriCube";
    else
      return newShapes;

    
    if(shape.terminal)
      return newShapes;

    var max = Math.random() * maxDeco;
    var offset = vec2.create();

    if(OutterGeo == "Cube")
    {
      var offsetSeed = Math.random();

      if(offsetSeed < 0.25)
      {
        offset = vec2.fromValues(shape.scale[0] * 0.4, shape.scale[2] * 0.4);
      }
      else if(offsetSeed < 0.5)
      {
        offset = vec2.fromValues(shape.scale[0] * 0.4, -shape.scale[2] * 0.4);
      }
      else if(offsetSeed < 0.75)
      {
        offset = vec2.fromValues(-shape.scale[0] * 0.4, shape.scale[2] * 0.4);
      } 
      else
      {
        offset = vec2.fromValues(-shape.scale[0] * 0.4, -shape.scale[2] * 0.4);
      }

      for(var i = 0; i < max ; i++)
      {
        newShapes.push( new Shape("Deco", OutterGeo, vec3.fromValues(shape.position[0] + offset[0], shape.position[1] + (shape.scale[1] * 0.1) * i, shape.position[2] + offset[1]), shape.rotation, vec3.fromValues(shape.scale[0] * 0.4, shape.scale[1] * 0.025, shape.scale[2] * 0.4), false, true, shape.index));
      }
    }
    else if(OutterGeo == "TriCube")
    {
      offset = vec2.fromValues(shape.scale[0] * 0.4, shape.scale[2] * 0.4);

      for(var i = 0; i < max ; i++)
      {
        newShapes.push( new Shape("Deco", OutterGeo, vec3.fromValues(shape.position[0] + offset[0], shape.position[1] + (shape.scale[1] * 0.1) * i, shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0] * 0.4, shape.scale[1] * 0.025, shape.scale[2] * 0.4), false, true, shape.index));
      }
    }
    return newShapes;  
  }

  SetRoof(shape: Shape, bTerminal : boolean) : Array<Shape>
  {
    let newShapes: Array<Shape>;
    newShapes = [];

    let OutterGeo : string;

    if(shape.geometry == "Cube" || shape.geometry == "Cube_Outter" )
      OutterGeo = "Cube_Roof";
    else if(shape.geometry == "HexaCube" || shape.geometry == "HexaCube_Outter" )
      OutterGeo = "HexaCube_Roof";
    else if(shape.geometry == "TriCube" || shape.geometry == "TriCube_Outter" )
    {
      var Prob = Math.random();
      if(Prob < 0.5)      
        OutterGeo = "TriCube_Roof_00";      
      else
      OutterGeo = "TriCube_Roof_01";
    }      
    else
      return newShapes;

      if(shape.geometry == "TriCube" || shape.geometry == "TriCube_Outter")
       newShapes.push( new Shape("Roof", OutterGeo, shape.position, shape.rotation, shape.scale, false, true, shape.index));
      else 
       newShapes.push( new Shape("Roof", OutterGeo, shape.position, shape.rotation, shape.scale, false, true, shape.index));     
      
      return newShapes;        
  }

  AddChildren(shape: Shape, numMin:number, numMax:number, bTerminal : boolean)  : Array<Shape>
  {

    let newShapes: Array<Shape>;
    newShapes = [];
    newShapes = this.Subdivide(shape, Math.random() < 0.5 ? "X" : "Z", Math.floor( Math.random() * (numMax + 1 - numMin) + numMin ), false, 1.0, bTerminal);
    return newShapes;
  }

  AddFloor(shape: Shape, numFloors:number, bTerminal : boolean) : Array<Shape>
  {
    let newShapes: Array<Shape>;
    newShapes = [];

    let OutterGeo : string;

    var floor = "Floor"

    if(shape.geometry == "Cube" || shape.geometry == "Cube_Outter" )
      OutterGeo = "Cube";
    else if(shape.geometry == "HexaCube" || shape.geometry == "HexaCube_Outter" )
      OutterGeo = "HexaCube";
    else if(shape.geometry == "TriCube" || shape.geometry == "TriCube_Outter" )
      OutterGeo = "TriCube";
    else
      return newShapes;

    var shapeIndex = 0;
    for(var i = 0; i <= numFloors; i++)
    {
       //top should be none, roof, generate children
      if(i == numFloors)
      {
        newShapes.push( new Shape(floor, OutterGeo, vec3.fromValues(shape.position[0], shape.position[1] + shape.scale[1] * i, shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1], shape.scale[2]), true, bTerminal, shape.index));
        
        var Prob = Math.random();

        if(Prob < 2.0 / numFloors   /*&& OutterGeo != "TriCube" */) //generate children  
        {                   
          let newShapes2: Array<Shape>;

          newShapes2 = this.AddChildren(newShapes[shapeIndex], 2, 2, false ); 

          newShapes.splice(shapeIndex, 1);

          for(var j = 0; j < newShapes2.length; j++)
          {
            newShapes2[j].top = true;
            newShapes.push(newShapes2[j]);
          }
        }
        else if(Prob < 0.8) //roof  
        {
          let newShapes2: Array<Shape>;
          newShapes2 = this.SetRoof(newShapes[shapeIndex], true);
          
          newShapes.splice(shapeIndex, 1);

          for(var j = 0; j < newShapes2.length; j++)
          {
            newShapes2[j].top = false;
            newShapes.push(newShapes2[j]);
          }
        }        
      }
      else
      {
        if( Math.random() < 0.2 && OutterGeo != "TriCube") // divide
        {
          if(Math.random() < 0.3)
          {
            if(OutterGeo == "Cube")
              OutterGeo = "HexaCube";
            else if(OutterGeo == "HexaCube")
             OutterGeo = "Cube";              
          }

          newShapes.push( new Shape(floor, OutterGeo, vec3.fromValues(shape.position[0], shape.position[1] + shape.scale[1] * i, shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1], shape.scale[2]), false, bTerminal, shape.index));
         
          let newShapes2: Array<Shape>;
          newShapes2 = this.AddChildren(newShapes[shapeIndex], 2, 3, false); 

          newShapes.splice(shapeIndex, 1);

          for(var j = 0; j < newShapes2.length; j++)
          {
            newShapes.push(newShapes2[j]);
          }

          shapeIndex += newShapes2.length - 1;

        }
        else
        {
          if(Math.random() < 0.3)
          {
            if(OutterGeo == "Cube")
              OutterGeo = "HexaCube";
            else if(OutterGeo == "HexaCube")
             OutterGeo = "Cube";              
          }
          newShapes.push( new Shape(floor, OutterGeo, vec3.fromValues(shape.position[0], shape.position[1] + shape.scale[1] * i, shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1], shape.scale[2]), false, bTerminal, shape.index));
        }
       }
      shapeIndex++;
    }

    return newShapes;
  }
  
  Subdivide(shape: Shape, Axis : string, divider : number, equal:boolean, reScale:number, bTerminal : boolean) : Array<Shape>
  {
    let newShapes: Array<Shape>;
    newShapes = [];

    if(Axis == "X")
    {
      if(divider % 2 == 1)
      {
        newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0]/divider, (equal == true) ? shape.scale[1] :  shape.scale[1] * reScale, (equal == true) ? shape.scale[2] : shape.scale[2] * reScale), false, bTerminal, shape.index));

        for(var i = 1; i <= Math.floor(divider / 2.0); i++)
        {
          if(!equal && (i % 2 == 0))
          {
             newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0] - ((1.0/divider) * shape.scale[0]) * i , shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0]/divider, shape.scale[1]* reScale, shape.scale[2]* reScale), false, bTerminal, shape.index));
            newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0] + ((1.0/divider) * shape.scale[0]) * i , shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0]/divider, shape.scale[1]* reScale, shape.scale[2]* reScale), false, bTerminal, shape.index));
          }
          else
          {
            newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0] - ((1.0/divider) * shape.scale[0]) * i , shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0]/divider, shape.scale[1], shape.scale[2]), false, bTerminal, shape.index));
            newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0] + ((1.0/divider) * shape.scale[0]) * i , shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0]/divider, shape.scale[1], shape.scale[2]), false, bTerminal, shape.index));
          }          
        }
      }
      else if(divider % 2 == 0)
      {
        for(var i = 1; i <= Math.floor(divider / 2.0); i++)
        {
          newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0] - ( (1.0/divider) * shape.scale[0]) * i + ((1.0/divider) * 0.5 * shape.scale[0]), shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0]/divider, shape.scale[1], shape.scale[2]), false, bTerminal, shape.index));
          newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0] + ( (1.0/divider) * shape.scale[0]) * i - ((1.0/divider) * 0.5 * shape.scale[0]), shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0]/divider, shape.scale[1], shape.scale[2]), false, bTerminal, shape.index));
        }
      }
    }
    else if(Axis == "Y")
    {
      if(divider % 2 == 1)
      {
        newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues((equal == true) ? shape.scale[0] : shape.scale[0] * reScale, shape.scale[1]/divider, (equal == true) ? shape.scale[2] : shape.scale[2] * reScale), false, bTerminal, shape.index));
      
        for(var i = 1; i <= Math.floor(divider / 2.0); i++)
        {
          if(!equal && (i % 2 == 0))
          {
            newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1] - ((1.0/divider) * shape.scale[1]) * i , shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0] * reScale, shape.scale[1]/divider, shape.scale[2] * reScale), false, bTerminal, shape.index));
            newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1] + ((1.0/divider) * shape.scale[1]) * i , shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0] * reScale, shape.scale[1]/divider, shape.scale[2] * reScale), false, bTerminal, shape.index));
          }
          else
          {
            newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1] - ((1.0/divider) * shape.scale[1]) * i , shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1]/divider, shape.scale[2]), false, bTerminal, shape.index));
            newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1] + ((1.0/divider) * shape.scale[1]) * i , shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1]/divider, shape.scale[2]), false, bTerminal, shape.index));
         }
        }
      }
      else if(divider % 2 == 0)
      {
        for(var i = 1; i <= Math.floor(divider / 2.0); i++)
        {
          newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1] - ((1.0/divider) * shape.scale[1]) * i + ((1.0/divider) * 0.5 * shape.scale[1]), shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1]/divider, shape.scale[2]), false, shape.terminal, shape.index));
          newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1] + ((1.0/divider) * shape.scale[1]) * i - ((1.0/divider) * 0.5 * shape.scale[1]), shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1]/divider, shape.scale[2]), false, shape.terminal, shape.index));
        }
      }
    }
    else if(Axis == "Z")
    {
      if(divider % 2 == 1)
      {
        newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues((equal == true) ? shape.scale[0] : shape.scale[0] * reScale, (equal == true) ? shape.scale[1] : shape.scale[1] * reScale, shape.scale[2]/divider), false, shape.terminal, shape.index));
      
        for(var i = 1; i <= Math.floor(divider / 2.0); i++)
        {
          if(!equal && (i % 2 == 0))
          {
            newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2] - ((1.0/divider) * shape.scale[2]) * i), shape.rotation, vec3.fromValues(shape.scale[0] * reScale, shape.scale[1] * reScale, shape.scale[2]/divider), false, false, shape.index));
            newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2] + ((1.0/divider) * shape.scale[2]) * i), shape.rotation, vec3.fromValues(shape.scale[0] * reScale, shape.scale[1] * reScale, shape.scale[2]/divider), false, false, shape.index));   }
          else
          {
            newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2] - ((1.0/divider) * shape.scale[2]) * i), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1], shape.scale[2]/divider), false, false, shape.index));
            newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2] + ((1.0/divider) * shape.scale[2]) * i), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1], shape.scale[2]/divider), false, false, shape.index));
          }
        }
      }
      else if(divider % 2 == 0)
      {
        for(var i = 1; i <= Math.floor(divider / 2.0); i++)
        {
          newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2] - ((1.0/divider) * shape.scale[2]) * i + ((1.0/divider) * 0.5 * shape.scale[2])), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1], shape.scale[2]/divider), false, false, shape.index));
          newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2] + ((1.0/divider) * shape.scale[2]) * i - ((1.0/divider) * 0.5 * shape.scale[2])), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1], shape.scale[2]/divider), false, false, shape.index));
        }
      }
    }
    return newShapes;
  }

  rules_Outter(shape: Shape) : Array<Shape>
  {
    let newShapes: Array<Shape>;
    newShapes = [];

    var prob = Math.random();

    if(prob < 0.3 && !shape.terminal)
    {
      newShapes = this.AddOutter(shape, 0.9, false);
    }
    else if(prob < 0.6 && !shape.terminal)
    {
      newShapes = this.AddOutter02(shape, 0.9, false);
    }
    else
    {
      let newShapes3: Array<Shape>;
      newShapes3 = [];

      newShapes.push( new Shape(shape.symbol, shape.geometry, vec3.fromValues(shape.position[0], shape.position[1], shape.position[2]), shape.rotation, vec3.fromValues(shape.scale[0], shape.scale[1], shape.scale[2]), false, true, shape.index));

      //Add deco
      for(var i = 0 ; i < newShapes.length; i++)
      {
        if(Math.random() < 0.3)
        {
          var newShapes2 = [];
          newShapes2 = this.rules_Deco(newShapes[i]);
  
          for(var j = 0 ; j < newShapes2.length; j++)
          {
            newShapes3.push(newShapes2[j]);
          }
        }
        else
        {
          newShapes[i].terminal = true;
          //newShapes[i].symbol = "Deco";
          newShapes3.push(newShapes[i]);
        }
      }
      return newShapes3;
    }
    return newShapes;
  }

  rules_Subdivide(shape: Shape) : Array<Shape>
  {
    let newShapes: Array<Shape>;
    newShapes = [];

    newShapes = this.Subdivide(shape, "X", 3, false, 1.0, true);
    return newShapes;
  }

  rules_Stack(shape: Shape, maxStack : number) : Array<Shape>
  {
    let newShapes: Array<Shape>;
    newShapes = [];

    var numStacks = Math.ceil(maxStack * (Math.random() * 3 + 2));

    //top should be none, roof, divided
    if(shape.top)
      newShapes = this.AddFloor(shape, numStacks, false);
    else
     newShapes.push(shape);

    let newShapes2: Array<Shape>;
    newShapes2 = [];

    //add outter
    for(var i = 0; i<newShapes.length; i++)
    {
      if(newShapes[i].top)
      {
        newShapes2.push(newShapes[i]);
      }
      else
      {
        let newOutterShapes: Array<Shape>;
        newOutterShapes = [];

        newOutterShapes = this.rules_Outter(newShapes[i]);

        for(var j = 0; j<newOutterShapes.length; j++)
        {          
          newOutterShapes[j].top = false;
          newShapes2.push(newOutterShapes[j]);
        }
      }
    }
    return newShapes2;
  }

  rules_Deco(shape: Shape) : Array<Shape>
  {
    let newShapes: Array<Shape>;
    newShapes = [];

    newShapes = this.AddDeco(shape, 3, true);
    return newShapes;
  }

  parseShapeGrammer(shapes: Array<Shape>, perlinResult: Array<number>, iterations: number) : Array<Shape>
  {
    for(var i = 0; i < iterations; i++)
    {
      for(var s = 0; s < shapes.length; s++)
      {
        var index = shapes[s].index;
        var result = perlinResult[index]; //should be normalized
        
        if(i == 0)
        {
          var y = Math.floor( index / this.mapSize );
          var x = Math.floor( index % this.mapSize );

          //if it is highWay
          var HWclass = this.highWayGrid[y][x];
          if(HWclass > 0)
          {
            let successors: Array<Shape>;

            if(HWclass == 1 || HWclass == 2) 
             successors = this.AddRoad00(shapes[s], false, true);
            else if(HWclass == 4 || HWclass == 8) 
             successors = this.AddRoad01(shapes[s], false, true);
            else
            {
              if(Math.random() < 0.5)
              successors = this.AddRoad00(shapes[s], true, true);
              else
              successors = this.AddRoad01(shapes[s], true, true);
            } 
             
            
             //remove old shape
            shapes.splice(s, 1);

            //add new shapes
            for(var n = 0; n < successors.length; n++)
            {
              shapes.splice(s + n, 0, successors[n]);
            }
            s += successors.length - 1;

            //shapes[s].terminal = true;
            //shapes[s].scale = vec3.fromValues(1.0, 1.0, 1.0);
          }
          else
          {
            y -= (this.mapSize / 2);
            x -= (this.mapSize / 2);

            y /= (this.mapSize / 2);
            x /= (this.mapSize / 2);

            //re-scale
            var re_scale = 0.5 + result*0.5;

            if( result < this.crowdedPopulation)
              re_scale *= 0.8;

            // Make Circle city
            if(x*x + y*y >= 1)
            {
              shapes[s].terminal = true;
              re_scale = 0.0;
            }

            shapes[s].scale = vec3.fromValues(re_scale, re_scale, re_scale);
          }

          
        }

        var thisShape = shapes[s];
        if(!thisShape.terminal)
        {
          let successors: Array<Shape>;
          
          successors = this.rules_Stack(thisShape, result);

          //remove old shape
          shapes.splice(s, 1);

          //add new shapes
          for(var n = 0; n < successors.length; n++)
          {
            shapes.splice(s + n, 0, successors[n]);
          }
          s += successors.length - 1;
        }
      }
    }
    return shapes;
  }

  createHighway(currentXParam : number, currentYParam : number, prevDirParam: number )
  {
    var currentX = currentXParam;
    var currentY = currentYParam;

    var prevDir = prevDirParam;   
    var currentDir = prevDir;  

    while( currentX >= 0 && currentY >= 0 && currentX < this.mapSize && currentY < this.mapSize)
    {
      if(this.highWayGrid[currentY][currentX] > 0)
      {
        if( (this.highWayGrid[currentY][currentX] == 1 || this.highWayGrid[currentY][currentX] == 2) && (prevDir == 1 || prevDir == 2))
         this.highWayGrid[currentY][currentX] = prevDir;
        else if( (this.highWayGrid[currentY][currentX] == 4 || this.highWayGrid[currentY][currentX] == 8) && (prevDir == 4 || prevDir == 8))
         this.highWayGrid[currentY][currentX] = prevDir;
        else
          this.highWayGrid[currentY][currentX] = 10;

      }
      else
        this.highWayGrid[currentY][currentX] = prevDir;

      //next Step    
      if(Math.random() < 0.9) //move forward (don't change direction)
      {      
        currentDir = prevDir;

        if(prevDir == 1)
        {       
          currentX += 1;
        }
        else if(prevDir == 2)
        {
          currentX -= 1;
        }
        else if(prevDir == 4)
        {
          currentY -= 1;
        }
        else if(prevDir == 8)
        {
          currentY += 1;
        }
      }
      else if(Math.random() < 0.95) //move forward and turn left
      {
        if(prevDir == 1)
        { 
          currentX += 1;
        }
        else if(prevDir == 2)
        {
          currentX -= 1;
        }
        else if(prevDir == 4)
        {
          currentY -= 1;
        }
        else if(prevDir == 8)
        {
          currentY += 1;
        }
      }
      else //move forward and turn right
      {
        if(prevDir == 1)
        {  
          currentX += 1;
        }
        else if(prevDir == 2)
        {
          currentX -= 1;
        }
        else if(prevDir == 4)
        {
          currentY -= 1;
        }
        else if(prevDir == 8)
        {
          currentY += 1;
        }
      }

      prevDir = currentDir;

    }
  }


  highWayGenerator()
  {
    //start from each side
    //up
    this.createHighway(Math.floor( (Math.random() * 0.3 + 0.1) * this.mapSize ), 0, 8);

    //down
    this.createHighway(Math.floor( (Math.random() * 0.3 + 0.6) * this.mapSize ), this.mapSize - 1, 4);

    //left
    this.createHighway(this.mapSize - 1, Math.floor( (Math.random() * 0.3 + 0.1) * this.mapSize ), 2);

    //right
    this.createHighway(0, Math.floor( (Math.random() * 0.3 + 0.6) * this.mapSize ), 1);
  } 

};

export default ShapeManager;
