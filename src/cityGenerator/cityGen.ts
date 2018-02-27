import {vec3, vec4, mat3, mat4} from 'gl-matrix';
import {gl} from '../globals';
import Perlin from './perlin';


class bufferContent{

  population: number;
  highWay_first: number;
  highWay_second: number;

  constructor(p : number, f : number, s : number)
  {   
    this.population = p;
    this.highWay_first = f;
    this.highWay_second = s;
  }

}

class CityGenerator{
 
  perlinGenerator: Perlin;

  bufferSize: number;
  InfoBuffer: any; 

  constructor(size : number) {   
    this.bufferSize = size;
    this.perlinGenerator = new Perlin;
  }

  clear()
  {
    for(var i = 0; i < this.InfoBuffer.length; i++)
    {
      for(var j = 0; j < this.InfoBuffer[i].length; j++)
      {
        delete this.InfoBuffer[i][j];
      }
      delete this.InfoBuffer[i];
    }   
  }

  create()
  {   
    this.InfoBuffer = new Array(this.bufferSize);

    for(var i = 0; i < this.InfoBuffer.length; i++)
    {
      this.InfoBuffer[i] = new Array(this.bufferSize);

      for(var j = 0; j < this.InfoBuffer[i].length; j++)
      {
        this.InfoBuffer[i][j] = new bufferContent( this.perlinGenerator.perlinNoise2D(i, j) , 0, 0);
      }
    }

    this.highWayGenerator();

    /*
    for(var i = 0; i < this.InfoBuffer.length; i++)
    {
      for(var j = 0; j < this.InfoBuffer[i].length; j++)
      {
        console.log( this.InfoBuffer[i][j] );
      }
    }
    */
  }


  createHighway(currentXParam : number, currentYParam : number, prevDirParam: number )
  {
    var currentX = currentXParam;
    var currentY = currentYParam;

    var prevDir = prevDirParam;   
    var currentDir = prevDir;  

    while( currentX >= 0 && currentY >= 0 && currentX < this.bufferSize && currentY < this.bufferSize)
    {
      this.InfoBuffer[currentY][currentX].highWay_first |= currentDir;

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
          currentDir = 4;
          currentX += 1;
        }
        else if(prevDir == 2)
        {
          currentDir = 8;
          currentX -= 1;
        }
        else if(prevDir == 4)
        {
          currentDir = 2;
          currentY -= 1;
        }
        else if(prevDir == 8)
        {
          currentDir = 1;
          currentY += 1;
        }
      }
      else //move forward and turn right
      {
        if(prevDir == 1)
        {       
          currentDir = 8;
          currentX += 1;
        }
        else if(prevDir == 2)
        {
          currentDir = 4;
          currentX -= 1;
        }
        else if(prevDir == 4)
        {
          currentDir = 1;
          currentY -= 1;
        }
        else if(prevDir == 8)
        {
          currentDir = 2;
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
    this.createHighway(Math.floor( (Math.random() * 0.3 + 0.1) * this.bufferSize ), 0, 8);

    //down
    this.createHighway(Math.floor( (Math.random() * 0.3 + 0.6) * this.bufferSize ), this.bufferSize - 1, 4);

    //left
    this.createHighway(this.bufferSize - 1, Math.floor( (Math.random() * 0.3 + 0.1) * this.bufferSize ), 2);

    //right
    this.createHighway(0, Math.floor( (Math.random() * 0.3 + 0.6) * this.bufferSize ), 1);
  }  
};

export default CityGenerator;
