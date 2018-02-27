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
#define TwoPi 6.28318530717958647692
#define InvPi 0.31830988618379067154
#define Inv2Pi 0.15915494309189533577
#define Inv4Pi 0.07957747154594766788

uniform vec4 u_CameraPos;

uniform sampler2D u_DiffuseMap;
uniform sampler2D u_NoiseMap;

uniform mat4 u_ModelInvTr;

uniform vec2 u_TimeInfo;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec2 fs_Uv;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.


vec3 applyNormalMap(vec3 geomnor, vec3 normap) {
    
    vec3 up = normalize(vec3(0.001, 1, 0.001));
    vec3 surftan = normalize(cross(geomnor, up));
    vec3 surfbinor = cross(geomnor, surftan);
    return normalize(normap.y * surftan + normap.x * surfbinor + normap.z * geomnor);
}

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

float hash(float n) { return fract(sin(n) * 1e4); }
float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
float noise(float x) { float i = floor(x); float f = fract(x); float u = f * f * (3.0 - 2.0 * f); return mix(hash(i), hash(i + 1.0), u); }

void main()
{
    // Material base color (before shading)
        vec4 diffuseColor;
        
        vec4 NormalMap = texture(u_DiffuseMap, fs_Uv * 4.0);
        vec3 normalVec;
        
        if(fs_Col.w < 0.5)
        {
            normalVec = applyNormalMap( fs_Nor.xyz, normalize((NormalMap.xyz * 2.0) - vec3(1.0)));

            diffuseColor = vec4(fs_Col.xyz, 1.0);

            // Calculate the diffuse term for Lambert shading
            float diffuseTerm = dot(normalVec, fs_LightVec.xyz);
            diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

            vec3 viewVec = normalize(u_CameraPos.xyz - fs_Pos.xyz);
            vec3 halfVec = viewVec + fs_LightVec.xyz;
            halfVec = normalize(halfVec);
            float LoH = clamp(dot( fs_LightVec.xyz, halfVec ), 0.0, 1.0);

            vec3 specularTerm = vec3(0.0);
            vec3 SpecularColor = vec3(1.0, 1.0, 1.0);
            float Roughness = 0.6;
            float energyConservation = 1.0 - Roughness;

            specularTerm = GGX_Spec(normalVec, halfVec, Roughness, diffuseColor.xyz, SpecularColor, LightingFunGGX_FV(LoH, Roughness)) *energyConservation;

            float ambientTerm = 0.05;

            vec3 lightColor = vec3(1.0, 1.0, 1.0);
        
            out_Col = vec4(diffuseColor.rgb * (diffuseTerm + ambientTerm) + SpecularColor * specularTerm, diffuseColor.a);
            out_Col.xyz *= lightColor;
        }            
        else if(fs_Col.w < 2.5) //emissive
        {
            float seed = fs_Col.w - 1.0;

            float time = u_TimeInfo.x;

            float Noise = (noise(seed) + 1.0) * 0.5;
            vec4 ttt;
            if(seed < 0.5 )
                ttt = texture(u_NoiseMap, fs_Uv + vec2(time*Noise + seed, 0.0));
            else
                ttt = texture(u_NoiseMap, fs_Uv + vec2(-time*Noise + seed, 0.0));
            

            out_Col = vec4( (fs_Col.xyz * (0.5 + ttt.z)) * 1.5, 1.0);
        }

        //Height
        vec4 fogColor = vec4( 0.40392, 0.94509, 0.98, 1.0) * 0.3;


        float alpha = clamp((2.0 - fs_Pos.y) * 0.5, 0.0, 1.0);

        
        out_Col = mix(clamp(out_Col, 0.0, 1.0), fogColor, alpha);
        out_Col.w = 1.0;     
}
