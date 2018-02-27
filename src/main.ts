import {vec2, vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';

import ShapeManger from './cityGenerator/shape';

import Icosphere from './geometry/Icosphere';

import Square from './geometry/Square';

import Branch from './geometry/Branch';
import Suzanne from './geometry/Suzanne';
import Flower from './geometry/Flower';
import Leaf from './geometry/Leaf';

import Triangular from './geometry/Triangular';

import Cylinder from './geometry/Cylinder';

import Cube from './geometry/Cube';
import Cube_Outter from './geometry/Cube_Outter';
import Cube_Roof from './geometry/Cube_Roof';

import HexaCube from './geometry/HexaCube';
import HexaCube_Outter from './geometry/HexaCube_Outter';
import HexaCube_Roof from './geometry/HexaCube_Roof';

import TriCube from './geometry/TriCube';
import TriCube_Outter from './geometry/TriCube_Outter';
import TriCube_Roof_00 from './geometry/TriCube_Roof_00';
import TriCube_Roof_01 from './geometry/TriCube_Roof_01';

import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

import * as OBJ from 'webgl-obj-loader';


// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  Iteration: 4,
  MapSize: 50,
  DensePopulationCap:0.7,
};

let icosphere: Icosphere;
let square: Square;

let cube: Cube;
let cube_Outter : Cube_Outter;
let cube_Roof : Cube_Roof;

let cylinder: Cylinder;

let hexaCube : HexaCube;
let hexaCube_Outter : HexaCube_Outter;
let hexaCube_Roof : HexaCube_Roof;

let triCube : TriCube;
let triCube_Outter : TriCube_Outter;
let triCube_Roof_00 : TriCube_Roof_00;
let triCube_Roof_01 : TriCube_Roof_01;

let time: number;

let shapeManager: ShapeManger;

let triangularScreen: Triangular;

let suz : Suzanne;
let branch : Branch;
let leaf : Leaf;
let flower : Flower;

let floor : Square;

let oldTime : number;
let currentTime : number;
let elapsedTime : number;
let deltaTime : number;

let prevFractTime : number = 0;
let randPeriodScale: number = 1;

let randomSkyUV : vec4;

let MeshManager : Array<string> = [];



function createShapes(bRefresh : boolean) {

  shapeManager.clear();

  if(bRefresh)
  {
    shapeManager.create();    
    shapeManager.bindTexture("src/textures/floor_norm.jpg");   
    shapeManager.bindTexture01("src/textures/Noise.png");
    shapeManager.bindTexture02("src/textures/envMap.jpg");
  }

  shapeManager.update(controls.Iteration, controls.MapSize, controls.DensePopulationCap);
  shapeManager.generateCity();

  shapeManager.bindBuffers();
}

function rotatePlanet(planet: Icosphere, radius: number, speed: number) {
    let seed: number;
    seed = speed * time;

    //radius *= 5.0;

    planet.updateRotY(seed);
    planet.updateNewPos(vec3.fromValues(radius * Math.cos(seed), 0, radius * Math.sin(seed)));
    planet.updateModelMat();

}

function loadObjs()
{
  branch = new Branch(vec3.fromValues(0, 0, 0));      
  branch.createdByLoader(MeshManager[0]);

  leaf = new Leaf(vec3.fromValues(0, 0, 0));  
  leaf.createdByLoader(MeshManager[1]);

  flower = new Flower(vec3.fromValues(0, 0, 0));   
  flower.createdByLoader(MeshManager[2]);

  suz = new Suzanne(vec3.fromValues(0, 0, 0));         
  suz.createdByLoader(MeshManager[3]);

  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.createdByLoader(MeshManager[4]);  
  

  cube_Outter = new Cube_Outter(vec3.fromValues(0, 0, 0));  
  cube_Outter.createdByLoader(MeshManager[5]);
  

  cylinder = new Cylinder(vec3.fromValues(0, 0, 0));
  cylinder.createdByLoader(MeshManager[6]);
  

  triCube = new TriCube(vec3.fromValues(0, 0, 0));
  triCube.createdByLoader(MeshManager[7]);
  

  triCube_Outter = new TriCube_Outter(vec3.fromValues(0, 0, 0)); 
  triCube_Outter.createdByLoader(MeshManager[8]);
  

  triCube_Roof_00 = new TriCube_Roof_00(vec3.fromValues(0, 0, 0));
  triCube_Roof_00.createdByLoader(MeshManager[9]);
  

  triCube_Roof_01 = new TriCube_Roof_01(vec3.fromValues(0, 0, 0)); 
  triCube_Roof_01.createdByLoader(MeshManager[10]);
  

  hexaCube = new HexaCube(vec3.fromValues(0, 0, 0));
  hexaCube.createdByLoader(MeshManager[11]);
  

  hexaCube_Outter = new HexaCube_Outter(vec3.fromValues(0, 0, 0));  
  hexaCube_Outter.createdByLoader(MeshManager[12]);
  

  hexaCube_Roof = new HexaCube_Roof(vec3.fromValues(0, 0, 0));
  hexaCube_Roof.createdByLoader(MeshManager[13]);
  

  cube_Roof = new Cube_Roof(vec3.fromValues(0, 0, 0));
  cube_Roof.createdByLoader(MeshManager[14]);
}

function play_single_sound() {
  var JukeBox = new AudioContext();
  fetch('music/Tron_ Legacy - The Grid (Instrumental Extended).mp3')
    .then(r=>r.arrayBuffer())
    .then(b=>JukeBox.decodeAudioData(b))
    .then(data=>{
        const audio_buf = JukeBox.createBufferSource();
        audio_buf.buffer = data;
        audio_buf.loop = true;
        audio_buf.connect(JukeBox.destination);
        audio_buf.start(0);
        });

        console.log(`Music On!`);
}

function main() {
  // Initial display for framerate

  play_single_sound();

  elapsedTime = 0.0;
  oldTime = Date.now();

  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();

  gui.add(controls, 'Iteration', 0, 6).step(1).onChange(function()
  {
    createShapes(true);
  });

  gui.add(controls, 'MapSize', 2, 64).step(2).onChange(function()
  {
    createShapes(true);
  });

  gui.add(controls, 'DensePopulationCap', 0.0, 1.0).step(0.01).onChange(function()
  {
    createShapes(true);
  });

  
 
  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);  

   //Load Object
  loadObjs();

  floor = new Square(vec3.fromValues(0, -0.5, 0));  
  floor.create();   
  floor.bindTexture("src/textures/circuit.png");
  floor.bindTexture01("src/textures/Noise.png");


  triangularScreen = new Triangular(vec3.fromValues(0, 0, 0));
  triangularScreen.create();
  triangularScreen.bindTexture("src/textures/envMap.jpg");
  triangularScreen.bindTexture01("src/textures/lightning_freq.jpg")


  const camera = new Camera(vec3.fromValues(-24, 10, -24), vec3.fromValues(0, 0, 0));
  const renderer = new OpenGLRenderer(canvas);
  gl.enable(gl.DEPTH_TEST);

  let lambertShader: ShaderProgram;
  let solarShader: ShaderProgram;
  let backGroundShader: ShaderProgram;

  //main shader
  lambertShader = new ShaderProgram([
      new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
      new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),]);

 
  shapeManager = new ShapeManger();
  shapeManager.getMeshes(cube, cube_Outter, cube_Roof, cylinder, hexaCube, hexaCube_Outter, hexaCube_Roof, triCube, triCube_Outter, triCube_Roof_00, triCube_Roof_01 );

  //Load main scene
  createShapes(true);

  //Floor     
  solarShader = new ShaderProgram([
          new Shader(gl.VERTEX_SHADER, require('./shaders/solarSystem-vert.glsl')),
          new Shader(gl.FRAGMENT_SHADER, require('./shaders/solarSystem-frag.glsl')), ]);

  //BackGround     
  backGroundShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/screenspace-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/background-frag.glsl')), ]);

  randomSkyUV = vec4.create();
    
  renderer.setClearColor(0.0, 0.0, 0.0, 1);

  function updateTime()
  {
    currentTime = Date.now();

    deltaTime = currentTime - oldTime;
    elapsedTime += deltaTime;    

    oldTime = currentTime;
  }

  // This function will be called every frame
  function tick()
  {
    updateTime();

    var period = Math.floor(elapsedTime * 0.005);
    if( prevFractTime < period )
    {
      randPeriodScale = (Math.random()*3.0 + 2.0);
      prevFractTime = period + randPeriodScale;
      randomSkyUV = vec4.fromValues(Math.random(), Math.random() * 0.5, Math.random(), Math.random()* 0.5);
    }

    camera.update();

    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    
    
    renderer.render(camera, lambertShader,
            [shapeManager],            
            vec2.fromValues(elapsedTime * 0.001, controls.MapSize),
            randomSkyUV
        );

        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);

    renderer.render(camera, solarShader,
      [floor],
      vec2.fromValues(elapsedTime * 0.001, controls.MapSize),
      randomSkyUV
    );

    gl.disable(gl.CULL_FACE);
    
    renderer.render(camera, backGroundShader,
      [triangularScreen],
      vec2.fromValues(elapsedTime * 0.001, controls.MapSize),
      randomSkyUV
    );

    
    
          
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

function readTextFile(file : string) : string
{
   console.log("Download" + file + "...");
    var rawFile = new XMLHttpRequest();
    let resultText : string;
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                resultText= rawFile.responseText;                
            }
        }
    }
    rawFile.send(null);

    return resultText;
}

function DownloadMeshes()
{
  MeshManager.push(readTextFile("./src/models/branch.obj"));
  MeshManager.push(readTextFile("./src/models/leaf.obj"));
  MeshManager.push(readTextFile("./src/models/flower.obj"));
  MeshManager.push(readTextFile("./src/models/suzanne.obj"));

  //buildings
  MeshManager.push(readTextFile("./src/models/Building/Building_Cube.obj"));
  MeshManager.push(readTextFile("./src/models/Building/Building_Cube_Outter.obj"));

  MeshManager.push(readTextFile("./src/models/Building/Building_Cylinder.obj"));

  MeshManager.push(readTextFile("./src/models/Building/Building_3sides.obj"));
  MeshManager.push(readTextFile("./src/models/Building/Building_3sides_Outter.obj"));
  MeshManager.push(readTextFile("./src/models/Building/Building_3sides_Roof_00.obj"));
  MeshManager.push(readTextFile("./src/models/Building/Building_3sides_Roof_01.obj"));

  MeshManager.push(readTextFile("./src/models/Building/Building_6sides.obj"));
  MeshManager.push(readTextFile("./src/models/Building/Building_6sides_Outter.obj"));
  MeshManager.push(readTextFile("./src/models/Building/Building_6sides_Roof.obj"));

  MeshManager.push(readTextFile("./src/models/Building/Building_Cube_Roof.obj"));

  console.log("Downloading is complete!");

  
  

  main();  
}

DownloadMeshes();

