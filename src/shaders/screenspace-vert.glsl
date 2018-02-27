#version 300 es

precision highp float;

in vec4 vs_Pos;

in vec2 vs_UV;

out vec4 fs_Pos;
out vec2 fs_UV;

void main() {
	// TODO: Pass relevant info to fragment

	fs_UV = vs_UV;
	gl_Position = vs_Pos;
	fs_Pos = vs_Pos;
}
