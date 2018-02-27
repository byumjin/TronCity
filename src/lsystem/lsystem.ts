import {vec3, vec4, mat3, mat4} from 'gl-matrix';
import {gl} from '../globals';
import Drawable from '../rendering/gl/Drawable';
import Cube from '../geometry/Cube';

import Suzanne from '../geometry/Suzanne';
import Branch from '../geometry/Branch';
import Flower from '../geometry/Flower';
import Leaf from '../geometry/Leaf';

import CityGen from '../cityGenerator/cityGen';
import ShapeManger from '../cityGenerator/shape';

class Lsystem extends Drawable{
  Axiom: string; 
  prevAxiom: string;
  nextAxiom: string;

  Iteration : number;
  Angle : number;
  

  BranchSize : number;
  LeafSize : number;
  FlowerSize : number;

  //turtle
  center: vec4;
  turtleModelMat :mat4;

  directVec: vec3;

  turtleStack: Array<mat4>;

  //branchStack
  branchstack: Array<Drawable>;
  classStack: Array<number>;

  modelMatstack: Array<mat4>;
  InvTranseMatstack: Array<mat4>;
  //meshesArray : Array<Mesh>;
  cube : Cube;
  suz : Suzanne;
  branch : Branch;
  flower : Flower;
  leaf : Leaf;

  constructor(center: vec3) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1.0);

    //this.suz = new Suzanne(vec3.fromValues(0, 0, 0));         
    //this.suz.create();
  }

  getMeshes(cube :Cube, branch : Branch, flower : Flower, leaf : Leaf, suz : Suzanne)
  {
    this.cube = cube;
    this.branch = branch;
    this.suz = suz;
    this.flower = flower;
    this.leaf = leaf;
  }

  clear()
  {
    this.destory();

    this.directVec = vec3.create();
    this.directVec = vec3.fromValues(0.0, 1.0, 0.0);

    this.modelMat = mat4.create();
    mat4.identity(this.modelMat);

    this.turtleModelMat = mat4.create();
    mat4.identity(this.turtleModelMat);

    this.transMat = mat4.create();
    mat4.identity(this.transMat);

    this.rotMat = mat4.create();
    mat4.identity(this.rotMat);

    this.scaleMat = mat4.create();
    mat4.identity(this.scaleMat);

    this.turtleStack = [];

    this.branchstack = [];
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

    this.prevAxiom = "";
    this.nextAxiom = "";
    this.Iteration = 0;
    this.Angle = 22.5;
    
    this.clear();

  }

  
  bindBuffers()
  {
    let startIndex: number;
    startIndex = 0;

    //merge all VBO data
    for(let m  = 0; m < this.branchstack.length; m++)
    {    
      var thisMesh = this.branchstack[m];
      var thisModelMat = this.modelMatstack[m];
      var thisInvTransMat = this.InvTranseMatstack[m];
      var classIndex = this.classStack[m];

      var randomVlaue = Math.random() * (0.8 - 0.5) + 0.5;
      randomVlaue *= 0.6;

      //var randomVlaue = 0.6;

      //var randomTimeSeed = Math.random();

      var colorRandomVlaueR = Math.random();
      var colorRandomVlaueG = Math.random();
      var colorRandomVlaueB = Math.random();

      for(let i  = 0; i < thisMesh.positions.length / 3; i++)
      { 
        let newPos : vec4;
        newPos = vec4.create();
     
        if(classIndex == 0)
        {
          newPos = this.mulMat4Vec4(thisModelMat, vec4.fromValues(thisMesh.positions[i*3] * this.BranchSize, thisMesh.positions[i*3 + 1], thisMesh.positions[i*3 + 2] * this.BranchSize, 1.0));
          this.colsArray.push( colorRandomVlaueR ); //x     
              
        }
        else if(classIndex == 2)
        {
          this.colsArray.push( 2.0 ); //x   
          newPos = this.mulMat4Vec4(thisModelMat, vec4.fromValues(thisMesh.positions[i*3] * this.LeafSize * randomVlaue, thisMesh.positions[i*3 + 1] * this.LeafSize * randomVlaue,
             thisMesh.positions[i*3 + 2] * this.LeafSize * randomVlaue, 1.0));
        }
        else if(classIndex == 1)
        {
          this.colsArray.push( 3.0 ); //x     
          newPos = this.mulMat4Vec4(thisModelMat, vec4.fromValues(thisMesh.positions[i*3] * this.FlowerSize * randomVlaue, thisMesh.positions[i*3 + 1] * this.FlowerSize * randomVlaue,
             thisMesh.positions[i*3 + 2] * this.FlowerSize * randomVlaue, 1.0));
        }        

        this.positionsArray.push( newPos[0] );
        this.positionsArray.push( newPos[1] );
        this.positionsArray.push( newPos[2] );
        this.positionsArray.push( newPos[3] );

        this.colsArray.push( colorRandomVlaueG ); //y    
        this.colsArray.push( colorRandomVlaueB ); //z    
        this.colsArray.push( 0.0 ); //w  
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

  testGrid()
  {
    
  }

  update(grammar: string, iter: number, bRefresh : boolean)
  {
    this.Axiom = grammar;
    this.Iteration = iter;

    if(bRefresh)
      this.Parsing();

    this.moving();
  }

  moving()
  {    
    for(let index = 0; index < this.prevAxiom.length; index++)
    {      
      var character = this.prevAxiom.charAt(index);
      let tempMovingMat = mat4.create();

      var bTrans = false;

      var bBranch = false;
      var bFlower = false;
      var bLeaf = false;

      //move upward
      if(character == 'F')
      {
        let tempTransMat = mat4.create();
        mat4.fromTranslation(tempTransMat, vec3.fromValues( this.rotMat[4], this.rotMat[5], this.rotMat[6]));
        tempMovingMat = tempTransMat;

        bBranch = true;
        bTrans = true;
      }
      //Leaf      
      else if(character == 'Y')
      {
        bFlower = true;
      }
      //Flower
      else if(character == 'L')
      {
        let tempTransMat = mat4.create();
        mat4.fromTranslation(tempTransMat, vec3.fromValues( this.rotMat[4] * 0.9, this.rotMat[5] * 0.9, this.rotMat[6] * 0.9));
        tempMovingMat = tempTransMat;

        bLeaf = true;
        bTrans = true;
      }
      //x+
      else if(character == '1')
      {
        let tempRotMat = mat4.create();
        mat4.fromXRotation(tempRotMat, this.Angle * 0.01745329251994329576923690768489);
        tempMovingMat = tempRotMat;

        bTrans = true;
      }
      //x-
      else if(character == '2')
      {
        let tempRotMat = mat4.create();
        mat4.fromXRotation(tempRotMat, this.Angle * -0.01745329251994329576923690768489);
        tempMovingMat = tempRotMat;

        bTrans = true;
      }
      //z+
      else if(character == '3')
      {
        let tempRotMat = mat4.create();
        mat4.fromZRotation(tempRotMat, this.Angle * 0.01745329251994329576923690768489);
        tempMovingMat = tempRotMat;

        bTrans = true;
      }
      //z-
      else if(character == '4')
      {
        let tempRotMat = mat4.create();
        mat4.fromZRotation(tempRotMat, this.Angle * -0.01745329251994329576923690768489);
        tempMovingMat = tempRotMat;

        bTrans = true;
      }
      //y+
      else if(character == '5')
      {
        let tempRotMat = mat4.create();
        mat4.fromYRotation(tempRotMat, this.Angle * 0.01745329251994329576923690768489);
        tempMovingMat = tempRotMat;

        bTrans = true;
      }
      //y-
      else if(character == '6')
      {
        let tempRotMat = mat4.create();
        mat4.fromYRotation(tempRotMat, this.Angle * -0.01745329251994329576923690768489);
        tempMovingMat = tempRotMat;

        bTrans = true;
      }
      //push status
      else if(character == '[')
      {
        let tempModelMat = mat4.create();
        tempModelMat = mat4.clone(this.turtleModelMat);
        this.turtleStack.push(tempModelMat);
      }
      //pop status
      else if(character == ']')
      {
        this.turtleModelMat = this.turtleStack.pop();   
      }

      if(bBranch)
      {        
        let tempModelMat = mat4.create();
        tempModelMat = mat4.clone(this.turtleModelMat);
        this.branchstack.push(this.branch);
        this.modelMatstack.push(tempModelMat);
        this.InvTranseMatstack.push(tempModelMat);

        this.classStack.push(0);
      }
      if(bLeaf)
      {        
        let tempModelMat = mat4.create();
        tempModelMat = mat4.clone(this.turtleModelMat);
        this.branchstack.push(this.leaf);
        this.modelMatstack.push(tempModelMat);
        this.InvTranseMatstack.push(tempModelMat);

        this.classStack.push(1);
      }
      if(bFlower)
      {        
        let tempModelMat = mat4.create();
        tempModelMat = mat4.clone(this.turtleModelMat);
        this.branchstack.push(this.flower);
        this.modelMatstack.push(tempModelMat);
        this.InvTranseMatstack.push(tempModelMat);

        this.classStack.push(2);
      }

      if(bTrans)
      {        
        //Trans
        mat4.multiply(this.turtleModelMat, this.turtleModelMat, tempMovingMat );
      }
    }
  }

  Parsing()
  {
    this.prevAxiom = this.Axiom;


    for(let iter = 0; iter < this.Iteration; iter++)
    {
      for(let index = 0; index < this.prevAxiom.length; index++)
      {      
        this.Mapping(this.prevAxiom.charAt(index));
      }

      this.prevAxiom = this.nextAxiom;
      this.nextAxiom = "";
    }  

    //console.log('Final Axiom : ' + this.prevAxiom);   
  }

  Mapping( character : string)
  {
    if(character == 'F')
    {
      this.nextAxiom += 'F3F4F4FF3F3F4F';
      
    }
    else if(character == 'X')
    {
      
      if(Math.random() > 0.1)
      {
        this.nextAxiom += '[1FY][F11X]F[F22X]F[F33X]F[Y44X][3[Y4L[5L][6L]]]Y';
      }
      else
      {
        this.nextAxiom += '[1F][F11X]F[F22X]F[F33X]F[6L][F44X][3FL]';
      }
    }
    else
    {
      this.nextAxiom += character;
    }
  }
};

export default Lsystem;
