import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const ffmpeg = process.env.FFMPEG_EXECUTABLE || "ffmpeg";
const root = fileURLToPath(new URL("../", import.meta.url));
const fps = 30;
const seconds = 5;
const proof = process.argv.includes("--prova");
const output = proof ? process.argv[process.argv.indexOf("--prova") + 1] : join(root, "assets", "video");
if (!output) throw new Error("Informe a pasta depois de --prova.");

const formats = [
  { name: "atraves-do-vidro", width: 1280, height: 736, vertical: false },
  { name: "atraves-do-vidro-vertical", width: 448, height: 896, vertical: true },
];
const files = {
  portrait: "campanha-1000.webp",
  prism: "prisma-1024.webp",
  skin: "pele-1150.webp",
  fruit: "mesa-1150.webp",
};
const textures = Object.fromEntries(await Promise.all(
  Object.entries(files).map(async ([name, file]) => {
    const source = await readFile(join(root, "assets", "images", file));
    return [name, "data:image/webp;base64," + source.toString("base64")];
  }),
));
const shader = await readFile(new URL("./filme.glsl", import.meta.url), "utf8");
await mkdir(output, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE,
  args: ["--enable-webgl", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"],
});

try {
  const page = await browser.newPage();
  for (const format of formats) {
    await page.goto("about:blank");
    await page.evaluate(async ({ format, shader, textures, scale }) => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(format.width * scale);
      canvas.height = Math.round(format.height * scale);
      document.body.append(canvas);
      const gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        preserveDrawingBuffer: true,
      });
      if (!gl) throw new Error("WebGL 2 indisponível para renderizar o filme.");

      function compile(type, code) {
        const part = gl.createShader(type);
        gl.shaderSource(part, code);
        gl.compileShader(part);
        if (!gl.getShaderParameter(part, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(part));
        return part;
      }

      const vertex = compile(gl.VERTEX_SHADER, [
        "#version 300 es",
        "void main() {",
        "  vec2 point = vec2(float(gl_VertexID == 1), float(gl_VertexID == 2));",
        "  gl_Position = vec4(point * 4. - 1., 0., 1.);",
        "}",
      ].join("\n"));
      const program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, shader));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const uniform = (name) => gl.getUniformLocation(program, name);
      const timeline = uniform("time");
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniform("size"), canvas.width, canvas.height);
      gl.uniform1i(uniform("vertical"), Number(format.vertical));

      const images = await Promise.all(Object.entries(textures).map(async ([name, source]) => {
        const image = new Image();
        image.src = source;
        await image.decode();
        return { name, image };
      }));
      for (const [index, { name, image }] of images.entries()) {
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(uniform(name), index);
      }

      window.renderFilmFrame = (time) => {
        gl.uniform1f(timeline, time);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        return canvas.toDataURL("image/jpeg", .97).split(",")[1];
      };
    }, { format, shader, textures, scale: proof ? 1 / 3 : 1 });

    async function renderFrame(time) {
      const frame = await page.evaluate((t) => window.renderFilmFrame(t), time);
      return Buffer.from(frame, "base64");
    }

    if (proof) {
      for (const time of [0, .14, .24, .34, .43, .51, .61, .71, .80, .90, 1]) {
        const suffix = String(Math.round(time * 100)).padStart(3, "0");
        await writeFile(join(output, format.name + "-" + suffix + ".jpg"), await renderFrame(time));
      }
      continue;
    }

    const target = join(output, format.name + ".mp4");
    const encoding = spawn(ffmpeg, [
      "-hide_banner", "-loglevel", "error", "-y",
      "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(fps), "-i", "pipe:0",
      "-an", "-c:v", "libx264", "-vf", "scale=in_range=full:out_range=tv:out_color_matrix=bt709",
      "-pix_fmt", "yuv420p", "-profile:v", "high", "-preset", "slow", "-crf", "24",
      "-g", "9", "-keyint_min", "9", "-sc_threshold", "0", "-bf", "0",
      "-movflags", "+faststart", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      target,
    ], { stdio: ["pipe", "inherit", "inherit"] });
    const closed = once(encoding, "close");
    const frames = fps * seconds;
    try {
      for (let index = 0; index < frames; index += 1) {
        const frame = await renderFrame(index / (frames - 1));
        if (!encoding.stdin.write(frame)) await once(encoding.stdin, "drain");
      }
    } finally {
      encoding.stdin.end();
    }
    const [code] = await closed;
    if (code !== 0) throw new Error("FFmpeg saiu com código " + code);
    console.log(target);

    if (!format.vertical) {
      const poster = spawn(ffmpeg, [
        "-hide_banner", "-loglevel", "error", "-y", "-i", target,
        "-frames:v", "1", "-vf", "scale=872:502", "-quality", "84",
        join(output, format.name + ".webp"),
      ], { stdio: "inherit" });
      const [posterCode] = await once(poster, "close");
      if (posterCode !== 0) throw new Error("FFmpeg não gravou o pôster.");
    }
  }
} finally {
  await browser.close();
}
