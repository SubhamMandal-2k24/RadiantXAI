import { useEffect, useRef } from "react";

const VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";

const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float m0 = min(u_res.x, u_res.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / m0;
  float t = u_time * 0.05;
  vec2 q = vec2(fbm(p * 1.5 + t), fbm(p * 1.5 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p * 1.5 + 2.0 * q + vec2(1.7, 9.2) + t * 1.2),
                fbm(p * 1.5 + 2.0 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p * 1.3 + 2.4 * r);
  vec3 col = vec3(0.024, 0.031, 0.094);
  col = mix(col, vec3(0.20, 0.10, 0.55), smoothstep(0.30, 0.85, f) * 0.85);
  col = mix(col, vec3(0.02, 0.40, 0.52), smoothstep(0.35, 1.0, length(q)) * 0.6);
  col += vec3(0.35, 0.10, 0.45) * smoothstep(0.62, 0.95, r.x) * 0.35;
  vec2 m = (u_mouse - 0.5 * u_res) / m0;
  col += vec3(0.10, 0.55, 0.75) * exp(-dot(p - m, p - m) * 7.0) * 0.5;
  float vig = 1.0 - smoothstep(0.2, 1.15, length(uv - 0.5) * 1.4);
  col *= mix(0.45, 1.0, vig);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export function AuroraCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl || gl.isContextLost()) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Aurora shader error:", gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Aurora link error:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    const SCALE = 0.55;
    let w = 2;
    let h = 2;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(2, Math.floor(r.width * SCALE));
      h = Math.max(2, Math.floor(r.height * SCALE));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mouse = { x: w * 0.7, y: h * 0.6 };
    const target = { x: mouse.x, y: mouse.y };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width) * w;
      target.y = (1 - (e.clientY - r.top) / r.height) * h;
    };
    window.addEventListener("pointermove", onMove);

    const onLost = (e: Event) => {
      e.preventDefault();
      canvas.style.opacity = "0";
    };
    canvas.addEventListener("webglcontextlost", onLost);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    const start = performance.now();
    let raf = 0;
    const draw = (now: number) => {
      if (visible && !document.hidden && !gl.isContextLost()) {
        mouse.x += (target.x - mouse.x) * 0.06;
        mouse.y += (target.y - mouse.y) * 0.06;
        gl.uniform2f(uRes, w, h);
        gl.uniform1f(uTime, (now - start) / 1000);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        canvas.style.opacity = "1";
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("webglcontextlost", onLost);
    };
  }, []);

  return (
    <canvas ref={ref} aria-hidden="true"
      className={`${className ?? ""} opacity-0 transition-opacity duration-1000`}
    />
  );
}