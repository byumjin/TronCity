#version 300 es

precision highp float;

#define PI 3.1415926535897932384626422832795028841971
#define TwoPi 6.28318530717958647692
#define InvPi 0.31830988618379067154
#define Inv2Pi 0.15915494309189533577
#define Inv4Pi 0.07957747154594766788

uniform mat4 u_Model;
uniform mat4 u_invViewProj;

uniform vec4 u_Color;
uniform sampler2D u_DiffuseMap;
uniform sampler2D u_NoiseMap;

uniform vec2 u_TimeInfo;
uniform vec4 u_SkyUVInfo;
uniform vec4 u_CameraPos;

in vec4 fs_Pos;
in vec2 fs_Uv;

out vec4 out_Col; 


float SphericalTheta(vec3 v)
{
	return acos(clamp(v.y, -1.0f, 1.0f));
}

float SphericalPhi(vec3 v)
{
	float p = atan(v.z , v.x);
	return (p < 0.0f) ? (p + TwoPi) : p;
}

vec2 getEnvMapUV(vec3 reflectionVec)
{
    return vec2(SphericalPhi(reflectionVec) * Inv2Pi, SphericalTheta(reflectionVec) * InvPi);
}

void main()
{
   vec4 worldPos = u_invViewProj * vec4( fs_Pos.xyz, 1 );
   worldPos /= worldPos.w;

   vec3 reflecVec = normalize(worldPos.xyz - u_CameraPos.xyz);
   vec2 uv = getEnvMapUV(reflecVec);

   vec4 thunderPos = u_invViewProj * vec4( u_SkyUVInfo.x * 2.0 - 1.0, (1.0 - u_SkyUVInfo.y) * 2.0 - 1.0, fs_Pos.z, 1 );
   thunderPos /= thunderPos.w;

   vec3 reflecThunderVec = normalize(thunderPos.xyz - u_CameraPos.xyz);
   vec2 thunderUV = getEnvMapUV(reflecThunderVec);

   vec4 noiseInfo = texture(u_NoiseMap, vec2(u_TimeInfo.x * 0.6, 0));
   
   float Intensity = noiseInfo.z;

   vec4 noiseInfo2 = texture(u_NoiseMap, vec2(-u_TimeInfo.x * 0.6 * 0.3756241, 0));

   Intensity *= noiseInfo2.y;
   

   float radius = (noiseInfo.x + 1.0);
   radius = pow(radius, 5.0);
   
   out_Col = texture( u_DiffuseMap, uv) * max( pow(clamp(dot(reflecVec, reflecThunderVec), 0.0, 1.0), radius) * (texture(u_NoiseMap, uv).x + 0.5), 0.6) * (1.4 + Intensity);
    
   out_Col.w = 1.0;
}
