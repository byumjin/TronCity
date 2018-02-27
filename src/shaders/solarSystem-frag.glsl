#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

#define PI 3.1415926535897932384626422832795028841971

uniform mat4 u_Model;

uniform vec4 u_Color; // The color with which to render this instance of geometry.
uniform sampler2D u_DiffuseMap;
uniform sampler2D u_NoiseMap;
uniform sampler2D u_EnvMap;

uniform vec2 u_TimeInfo;
uniform vec4 u_CameraPos;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec2 fs_Uv;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

vec2 LightingFunGGX_FV(float dotLH, float roughness)
{
	float alpha = roughness*roughness;

	//F
	float F_a, F_b;
	float dotLH5 = pow(clamp(1.0f - dotLH, 0.0f, 1.0f), 5.0f);
	F_a = 1.0f;
	F_b = dotLH5;

	//V
	float vis;
	float k = alpha * 0.5f;
	float k2 = k*k;
	float invK2 = 1.0f - k2;
	vis = 1.0f/(dotLH*dotLH*invK2 + k2);

	return vec2((F_a - F_b)*vis, F_b*vis);
}

float LightingFuncGGX_D(float dotNH, float roughness)
{
	float alpha = roughness*roughness;
	float alphaSqr = alpha*alpha;
	float denom = dotNH * dotNH * (alphaSqr - 1.0f) + 1.0f;

	return alphaSqr / (PI*denom*denom);
}

vec3 GGX_Spec(vec3 Normal, vec3 HalfVec, float Roughness, vec3 BaseColor, vec3 SpecularColor, vec2 paraFV)
{
	float NoH = clamp(dot(Normal, HalfVec), 0.0, 1.0);

	float D = LightingFuncGGX_D(NoH * NoH * NoH * NoH, Roughness);
	vec2 FV_helper = paraFV;

	vec3 F0 = SpecularColor;
	vec3 FV = F0*FV_helper.x + vec3(FV_helper.y, FV_helper.y, FV_helper.y);
	
	return D * FV;
}

float depthLinear(float depth)
{	
	float f = 1000.0;
	float n = 0.1;
	return (2.0 * n) / (f + n - depth * (f - n));
}

void main()
{
    vec4 black = vec4(0, 0, 0, 1);
    vec4 floor = vec4(0.40392, 0.94509, 0.98, 1);

    vec4 DiffuseMap = texture(u_DiffuseMap, fs_Uv * vec2(16.0, 32.0) );

    vec3 viewVec = normalize(u_CameraPos.xyz - fs_Pos.xyz);
    vec3 halfVec = viewVec + fs_LightVec.xyz;
    halfVec = normalize(halfVec);
    float LoH = clamp(dot( fs_LightVec.xyz, halfVec ), 0.0, 1.0);

    vec3 specularTerm = vec3(0.0);
    vec3 SpecularColor = vec3(1.0, 1.0, 1.0);
    float Roughness = 0.2;
    float energyConservation = 1.0 - Roughness;

    vec3 normalVec = fs_Nor.xyz;

    specularTerm = GGX_Spec(normalVec, halfVec, Roughness, DiffuseMap.xyz, SpecularColor, LightingFunGGX_FV(LoH, Roughness)) *energyConservation;


    float time = u_TimeInfo.x * 0.01;
    vec4 noise01 = texture(u_NoiseMap, (fs_Uv + vec2(time, 0.0)) * 31.23);

    time *= 0.5;

    vec4 noise02 = texture(u_NoiseMap, (fs_Uv + vec2(time * 0.83, 0.0 )) * 7.523);
    vec4 noise03 = texture(u_NoiseMap, (fs_Uv + vec2(0.0, time * 0.9341)) * 6.863);
    vec4 noise04 = texture(u_NoiseMap, (fs_Uv - vec2(0.0, time * 0.863)) * 10.2343);    

    float alpha = smoothstep(0.0, 1.0, sqrt(fs_Pos.x * fs_Pos.x + fs_Pos.z * fs_Pos.z) / (u_TimeInfo.y * 0.7) );
    float depth = distance(u_CameraPos.xyz, fs_Pos.xyz);

    alpha = pow(alpha, 3.0);

    out_Col = mix(DiffuseMap * 0.8, DiffuseMap * noise01.x * noise02.y * noise03.y * noise04.y, alpha);
    out_Col += vec4(SpecularColor * specularTerm, 0.0) * (1.0 - alpha) * 0.01;

    float fog = clamp( (1.0 - depth / 2000.0), 0.0, 1.0);
    vec4 fogColor = vec4( 0.40392, 0.94509, 0.98, 1.0) * 0.3;
    out_Col = mix(fogColor, out_Col, fog*fog);
    
    out_Col.w = 1.0;
}
