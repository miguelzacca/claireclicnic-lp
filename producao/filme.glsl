#version 300 es
precision highp float;

uniform vec2 size;
uniform float time;
uniform bool vertical;
uniform sampler2D portrait;
uniform sampler2D prism;
uniform sampler2D skin;
uniform sampler2D fruit;
out vec4 fragment;

const vec3 wine = vec3(.141, .070, .094);
const vec3 copper = vec3(1., .51, .31);
const vec3 champagne = vec3(1., .82, .65);
const float pi = 3.14159265;

float ease(float a, float b) {
  return smoothstep(a, b, time);
}

float square(float value) {
  return value * value;
}

vec3 plate(sampler2D image, vec2 position, float ratio, vec2 anchor, float zoom) {
  vec2 source = vec2(textureSize(image, 0));
  float sourceRatio = source.x / source.y;
  vec2 crop = min(vec2(1.), vec2(ratio / sourceRatio, sourceRatio / ratio)) / zoom;
  return texture(image, clamp((position - .5) * crop + mix(crop * .5, 1. - crop * .5, anchor), 0., 1.)).rgb;
}

float boxMask(vec2 p, vec2 radius) {
  vec2 corner = max(vec2(abs(p.x - .5) - (.5 - radius.x), radius.y - p.y), 0.);
  float arch = 1. - smoothstep(.983, 1.003, length(corner / radius));
  vec2 edge = min(p, 1. - p);
  return smoothstep(-.001, .002, min(edge.x, edge.y)) * arch;
}

vec3 carePanels(vec2 p) {
  float settle = ease(.725, .985);
  float zoom = 1. + .52 * (1. - ease(.57, .91));
  vec4 skinBox = vertical
    ? mix(vec4(-.035, -.10, 1.035, .51), vec4(.053, .127, .947, .531), settle)
    : mix(vec4(-.115, -.10, .521, 1.10), vec4(.053, .208, .490, .879), settle);
  vec4 fruitBox = vertical
    ? mix(vec4(-.035, .49, 1.035, 1.10), vec4(.053, .546, .947, .945), settle)
    : mix(vec4(.479, -.10, 1.115, 1.10), vec4(.510, .208, .947, .879), settle);
  vec2 skinSize = skinBox.zw - skinBox.xy;
  vec2 fruitSize = fruitBox.zw - fruitBox.xy;
  vec2 s = (p - skinBox.xy) / skinSize;
  vec2 f = (p - fruitBox.xy) / fruitSize;
  float aspect = size.x / size.y;
  vec3 face = plate(skin, s, aspect * skinSize.x / skinSize.y, vec2(.63, .52), zoom);
  vec3 table = plate(fruit, f, aspect * fruitSize.x / fruitSize.y, vec2(.44, .48), zoom);
  vec2 radius = mix(vec2(.015, .025), vec2(.45, vertical ? .19 : .16), settle);
  float splitAxis = vertical ? p.y : p.x;
  float hinge = .50 + (vertical ? .065 : .045) * sin(p.x * 3.7 + p.y * 3.9) * (1. - settle);
  float split = smoothstep(hinge - .045, hinge + .039, splitAxis);
  vec3 panels = mix(face, table, split);
  vec3 backdrop = wine + vec3(.171, .091, .102) * exp(-5.6 * dot(p - .48, p - .48));
  vec3 framed = mix(mix(backdrop, face, boxMask(s, radius)), table, boxMask(f, radius));
  return mix(panels, framed, ease(.73, .94));
}

vec3 scene(vec2 p) {
  float aspect = size.x / size.y;
  float approach = ease(.036, .294);
  vec4 firstPose = vertical ? vec4(.053, .0325, .947, .6625) : vec4(.496, .069, .926, .929);
  vec4 closeUp = vertical ? vec4(-.085, -.048, 1.055, 1.035) : vec4(-.068, -.072, 1.068, 1.072);
  vec4 portraitBox = mix(firstPose, closeUp, approach);
  vec2 photoSize = portraitBox.zw - portraitBox.xy;
  vec2 photoPoint = (p - portraitBox.xy) / photoSize;
  vec2 firstAnchor = vertical ? vec2(.52, .36) : vec2(.53, .43);
  vec2 faceAnchor = mix(firstAnchor, vec2(.42, .19), approach);
  vec3 face = plate(portrait, photoPoint, aspect * photoSize.x / photoSize.y, faceAnchor, 1. + .31 * approach);
  vec2 corner = mix(vec2(.48, vertical ? .23 : .21), vec2(.009, .015), approach);
  vec3 paper = mix(vec3(.984, .961, .929), vec3(.937, .882, .831), clamp(.58 * p.x + .42 * p.y, 0., 1.));
  vec3 backdrop = mix(paper, wine, ease(.07, .30));
  face = mix(backdrop, face, boxMask(photoPoint, corner));

  float flight = ease(.23, .70);
  vec2 drift = p + vec2(.11 * (flight - .5) * (p.y + .6), .08 * (.5 - flight));
  vec3 surface = plate(prism, drift, aspect, vec2(mix(.30, .81, flight), .55), 1.03 + .32 * sin(flight * pi));
  surface *= mix(vec3(.76, .65, .70), vec3(1.10, .95, .92), flight);
  surface += wine * .12;
  float turn = ease(.18, .47);
  float open = ease(.49, .77);
  float wave = sin((vertical ? p.y * .6 + p.x * .4 : p.x) * 5. + p.y * 3.);
  float reveal = clamp(open + .25 * wave * sin(open * pi), 0., 1.);
  return mix(mix(face, surface, turn), carePanels(p), reveal);
}

// The lens cross-section supplies both the offset of the transmitted image
// and the specular normals. The flutes run along the curved face of the glass.
vec3 ribbon(vec3 base, vec2 p, float center, float thickness, float twist, float presence, float light) {
  float y = p.y - .50;
  float curve = center + twist * (.36 * sin(y * 4.35 + .48) + .24 * y);
  float width = thickness * (1. + .27 * cos(y * 4.75 + twist * 1.6));
  float u = (p.x - curve) / width;
  float rim = smoothstep(.965, 1.006, abs(u));
  if (rim >= 1. || presence <= 0.) return base;

  float body = sqrt(max(.001, 1. - u * u));
  float rib = u * (vertical ? 49. : 66.) + 1.95 * y + twist * 1.4;
  float flute = cos(rib);
  float slope = (u + .052 * flute) / max(.38, body);
  float fresnel = pow(1. - body, 2.3);
  vec2 displacement = vec2(.052 * slope + .006 * flute,
                           (.010 + .019 * abs(u)) * sin(6. * y + twist) - .005 * flute);
  vec3 glass = scene(p + displacement);
  float dispersion = .004 * (fresnel + abs(flute) * .24);
  glass.r = scene(p + displacement + vec2(dispersion, -.55 * dispersion)).r;
  glass.b = scene(p + displacement - vec2(dispersion, -.55 * dispersion)).b;
  glass *= mix(vec3(.79, .53, .61), vec3(1.06, .94, .86), body);

  float key = u - light - .15 * sin(y * 4. + twist);
  float specular = exp(-6.2 * key * key) * (.17 + .83 * pow(.5 + .5 * cos(rib + .66), 6.));
  float stretch = exp(-4.2 * square(y + .16 * sin(twist * 3.) + .36 * u));
  float horizon = exp(-125. * square(y + .30 - .34 * u - .16 * cos(twist * 1.9)));
  float edge = exp(-290.0 * square(abs(u) - .925));
  float polish = exp(-45.0 * square(u + .52 - light * .35 + .09 * sin(y * 4.8)));

  glass += copper * (fresnel * .28 + horizon * .11) * (1. - .25 * y);
  glass += champagne * (specular * stretch * .27 + edge * (.042 + .16 * stretch) + polish * .105);
  glass *= 1. - .14 * pow(.5 - .5 * cos(rib + .5), 5.) * body;
  return mix(base, glass, (1. - rim) * presence);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, size.y - gl_FragCoord.y) / size;
  vec3 color = scene(p);

  float passage = ease(.06, .74);
  float open = ease(.52, .86);
  float entry = 1. - ease(.71, .925);
  float bow = mix(.62, -.59, passage);
  float nearX = mix(1.27, -.52, passage) + .055 * sin(time * pi * 2.);
  float farX = mix(1.23, .45, ease(.07, .49)) + 1.02 * open;
  color = ribbon(color, p, farX, mix(.13, .45, ease(.14, .44)), -.88 + .83 * passage,
                 ease(.08, .28) * entry * .91, -.56 + 1.42 * open);
  color = ribbon(color, p, nearX, mix(.19, .53, sin(passage * pi)), bow,
                 ease(.02, .125) * entry, .49 - 1.02 * passage);

  float light = ease(.22, .39) * (1. - ease(.41, .61));
  float beam = exp(-21. * square(p.x - .46 + .24 * sin(p.y * 4. - .8)));
  float spill = exp(-2.2 * dot(p - vec2(.57, .42), p - vec2(.57, .42)));
  color += (champagne * .072 * beam * spill + copper * .043 * spill) * light;

  float vignette = dot((p - .5) * vec2(.90, 1.1), (p - .5) * vec2(.90, 1.1));
  color *= 1. - .32 * ease(.055, .39) * vignette;
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(127.1, 311.7))) * 43758.5453) - .5;
  color += grain * ease(.035, .17) * (.012 - .007 * ease(.72, 1.));
  fragment = vec4(clamp(color, 0., 1.), 1.);
}
