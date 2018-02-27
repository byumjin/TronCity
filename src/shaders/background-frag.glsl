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

uniform vec2 u_TimeInfo;
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

   out_Col = texture( u_DiffuseMap, getEnvMapUV(normalize(worldPos.xyz - u_CameraPos.xyz)));
    
   out_Col.w = 1.0;
}
