import {vec2, vec3, vec4, mat3, mat4} from 'gl-matrix';
import {gl} from '../globals';


class bufferContent{

  direction: vec2;
  dotValue: number;

  constructor()
  {   
    this.direction = vec2.create();
    this.dotValue = 0.0;
  }

}

class Perlin{

  directionBuffer: any; 
  perlinNoiseBuffer: any;

  clear()
  {

    
  }

  noise2D( x: number, z: number) : number {
   
    var prime0 = 13;
    var prime1 = 15731;
    var prime2 = 789221;
    var prime3 = 1376312589;
    var prime4 = 1073741824.0;
    var primez = 59;

    var n = x + z*primez;
    n = (n<<prime0) ^ n;
    return ( 1.0 - ( (n * (n * n * prime1 + prime2) + prime3) & 0x7fffffff) / prime4);
  }

  smoothedNoise2D(x: number, z: number) : number
  {
    var corners = ( this.noise2D(x-1, z-1) + this.noise2D(x+1, z-1) + this.noise2D(x-1, z+1) + this.noise2D(x+1, z+1) ) / 16.0;
    var sides   = ( this.noise2D(x-1, z  ) + this.noise2D(x+1, z  ) + this.noise2D(x  , z-1) + this.noise2D(x  , z+1) ) /  8.0;
    var center  =   this.noise2D(x  , z  ) / 4.0;
    return corners + sides + center;
  }

  interpolate(v0: number, v1: number, v2: number, v3: number, u: number): number
  {
    var P = (v3 - v2) - (v0 - v1);
    var Q = (v0 - v1) - P;
    var R = v2 - v0;
    var S = v1;

    return P*(u*u*u) + Q*(u*u) + R*u + S;
  }

  interpolatedNoise2D(x: number, z: number)
  {
    var integer_X    = Math.floor(x);
    var fractional_X = Math.abs(x - integer_X);

    var  integer_Z    = Math.floor(z);
    var  fractional_Z = Math.abs(z - integer_Z);

    var v0_botprev     = this.smoothedNoise2D(integer_X-1, integer_Z-1);
    var v1_botprev     = this.smoothedNoise2D(integer_X  , integer_Z-1);
    var v2_botprev     = this.smoothedNoise2D(integer_X+1, integer_Z-1);
    var v3_botprev     = this.smoothedNoise2D(integer_X+2, integer_Z-1);

    var v0_bot         = this.smoothedNoise2D(integer_X-1, integer_Z  );
    var v1_bot         = this.smoothedNoise2D(integer_X  , integer_Z  );
    var v2_bot         = this.smoothedNoise2D(integer_X+1, integer_Z  );
    var v3_bot         = this.smoothedNoise2D(integer_X+2, integer_Z  );

    var v0_top         = this.smoothedNoise2D(integer_X-1, integer_Z+1);
    var v1_top         = this.smoothedNoise2D(integer_X  , integer_Z+1);
    var v2_top         = this.smoothedNoise2D(integer_X+1, integer_Z+1);
    var v3_top         = this.smoothedNoise2D(integer_X+2, integer_Z+1);

    var v0_topafter    = this.smoothedNoise2D(integer_X-1, integer_Z+2);
    var v1_topafter    = this.smoothedNoise2D(integer_X  , integer_Z+2);
    var v2_topafter    = this.smoothedNoise2D(integer_X+1, integer_Z+2);
    var v3_topafter    = this.smoothedNoise2D(integer_X+2, integer_Z+2);

    var ix_botprev  = this.interpolate(v0_botprev , v1_botprev , v2_botprev , v3_botprev , fractional_X);
    var ix_bot      = this.interpolate(v0_bot     , v1_bot     , v2_bot     , v3_bot     , fractional_X);
    var ix_top      = this.interpolate(v0_top     , v1_top     , v2_top     , v3_top     , fractional_X);
    var ix_topafter = this.interpolate(v0_topafter, v1_topafter, v2_topafter, v3_topafter, fractional_X);

    return this.interpolate(ix_botprev, ix_bot, ix_top, ix_topafter, fractional_Z);
 }

 clamp(value : number, min : number, max : number) : number
 {
  return Math.min( Math.max(value, min), max);
 }

 perlinNoise2D(x : number, z : number) : number
 {
  var total = 0.0;
  var OCTAVES = 8;
  var SCALE2D = 1;
  var PERSISTANCE = 0.5;
  for(var i = 0; i < OCTAVES; i++) {
      var bit = 1;
      var frequency = bit << i; // 2 to the ith power, 1,2,4,8,16,etc.
      var amplitude = Math.pow(PERSISTANCE, (i));
      total += this.interpolatedNoise2D(x * frequency, z * frequency) * amplitude;
  }
  total *= SCALE2D;//additional dimension reduces likelyhood that this is 1
  return this.clamp(total, -4.0, 4.0);
 }

 biCubic( v0: number, v1: number, u:number ):number
 {
   return v0 - (3.0 * u*u - 2.0 * u * u * u) * (v0 - v1);
 }

 originalPerlinNoise2D(size : number)
 {
  let grid : Array<number> = [];
  
  this.directionBuffer = new Array(size + 1);

    for(var i = 0; i < this.directionBuffer.length; i++)
    {
      this.directionBuffer[i] = new Array(size + 1);

      for(var j = 0; j < this.directionBuffer[i].length; j++)
      {
        this.directionBuffer[i][j] = new bufferContent();
        var normalizeVec = vec2.create();
        this.directionBuffer[i][j].direction = vec2.normalize(normalizeVec, vec2.fromValues( Math.random() * 2.0 - 1.0, Math.random()* 2.0 - 1.0));

      }
    }

    this.perlinNoiseBuffer = new Array(size);

    var min = 100;
    var max = -100;

    for(var i = 0; i < size; i++)
    {
      this.perlinNoiseBuffer[i] = new Array(size);

      for(var j = 0; j < size; j++)
      {
        var v0 = vec2.create();
        vec2.sub(v0, vec2.fromValues(i + 0.5, j + 0.5) , this.directionBuffer[i][j].direction ); 

        var dotV0 = vec2.dot(v0, this.directionBuffer[i][j].direction);

        var v1 = vec2.create();
        vec2.sub(v1, vec2.fromValues(i + 0.5, j + 0.5) , this.directionBuffer[i+1][j].direction); 

        var dotV1 = vec2.dot(v1, this.directionBuffer[i+1][j].direction);

        var v2 = vec2.create();
        vec2.sub(v2, vec2.fromValues(i + 0.5, j + 0.5) , this.directionBuffer[i][j+1].direction); 

        var dotV2 = vec2.dot(v2, this.directionBuffer[i][j+1].direction);

        var v3 = vec2.create();
        vec2.sub(v3, vec2.fromValues(i + 0.5, j + 0.5) , this.directionBuffer[i+1][j+1].direction); 

        var dotV3 = vec2.dot(v3, this.directionBuffer[i+1][j+1].direction);

        //bi-cubic interpolation
        var dotV02 = this.biCubic(dotV0, dotV2, 0.5); //x
        var dotV13 = this.biCubic(dotV1, dotV3, 0.5); //x

        var dotVY = this.biCubic(dotV02, dotV13, 0.5); //x

        this.perlinNoiseBuffer[i][j] = dotVY;

        min = Math.min(min, dotVY);
        max = Math.max(max, dotVY);
      }
    }

    //console.log("Min : " + min);
    //console.log("Max : " + max);

    for(var i = 0; i < size; i++)
    {
      for(var j = 0; j < size; j++)
      {
        this.perlinNoiseBuffer[i][j] = (this.perlinNoiseBuffer[i][j] - min) / (max - min);
      }
    }
 }
}


export default Perlin;
