uniform vec3 color;
varying vec2 vUv;

void main() {
  float dist = length(gl_FragCoord.xy - vec2(0.5));
  float pattern = step(0.5, mod(gl_FragCoord.x + gl_FragCoord.y, 10.0));
  gl_FragColor = mix(vec4(color, 1.0), vec4(0.0), pattern);
}