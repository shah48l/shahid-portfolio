/* ==========================================================================
   SPLASH CURSOR — WebGL Fluid Simulation (inspired by ReactBits SplashCursor)
   Vanilla JS port of the WebGL fluid dynamics effect.
   Full-screen transparent canvas, reacts to mouse/touch movement.
   ========================================================================== */

const SplashCursor = (() => {
  'use strict';

  let canvas, gl, ext;
  let config, pointers, splatStack = [];
  let animId;
  let isActive = false;

  const DEFAULTS = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    DENSITY_DISSIPATION: 2.5,
    VELOCITY_DISSIPATION: 1.5,
    PRESSURE: 0.1,
    PRESSURE_ITERATIONS: 20,
    CURL: 4,
    SPLAT_RADIUS: 0.3,
    SPLAT_FORCE: 8000,
    SHADING: true,
    COLOR_UPDATE_SPEED: 10,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: true,
  };

  function pointerPrototype() {
    this.id = -1; this.texcoordX = 0; this.texcoordY = 0;
    this.prevTexcoordX = 0; this.prevTexcoordY = 0;
    this.deltaX = 0; this.deltaY = 0;
    this.down = false; this.moved = false; this.color = [0, 0, 0];
  }

  function init() {
    canvas = document.getElementById('splashCanvas');
    if (!canvas) return;

    config = { ...DEFAULTS };
    pointers = [new pointerPrototype()];
    isActive = true;

    const result = getWebGLContext(canvas);
    if (!result) return;
    gl = result.gl;
    ext = result.ext;

    if (!ext.supportLinearFiltering) {
      config.DYE_RESOLUTION = 256;
      config.SHADING = false;
    }

    compileAllShaders();
    initFramebuffers();
    bindEvents();
    updateKeywords();
    lastUpdateTime = Date.now();
    updateFrame();
  }

  // ── WebGL Context ──
  function getWebGLContext(c) {
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    let g = c.getContext('webgl2', params);
    const isWebGL2 = !!g;
    if (!isWebGL2) g = c.getContext('webgl', params) || c.getContext('experimental-webgl', params);
    if (!g) return null;

    let halfFloat, supportLinearFiltering;
    if (isWebGL2) {
      g.getExtension('EXT_color_buffer_float');
      supportLinearFiltering = g.getExtension('OES_texture_float_linear');
    } else {
      halfFloat = g.getExtension('OES_texture_half_float');
      supportLinearFiltering = g.getExtension('OES_texture_half_float_linear');
    }
    g.clearColor(0, 0, 0, 1);

    const halfFloatTexType = isWebGL2 ? g.HALF_FLOAT : (halfFloat && halfFloat.HALF_FLOAT_OES);
    let formatRGBA, formatRG, formatR;
    if (isWebGL2) {
      formatRGBA = getSupportedFormat(g, g.RGBA16F, g.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(g, g.RG16F, g.RG, halfFloatTexType);
      formatR = getSupportedFormat(g, g.R16F, g.RED, halfFloatTexType);
    } else {
      formatRGBA = formatRG = formatR = getSupportedFormat(g, g.RGBA, g.RGBA, halfFloatTexType);
    }
    return { gl: g, ext: { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering } };
  }

  function getSupportedFormat(g, internalFormat, format, type) {
    if (!supportRenderTextureFormat(g, internalFormat, format, type)) {
      if (internalFormat === g.R16F) return getSupportedFormat(g, g.RG16F, g.RG, type);
      if (internalFormat === g.RG16F) return getSupportedFormat(g, g.RGBA16F, g.RGBA, type);
      return null;
    }
    return { internalFormat, format };
  }

  function supportRenderTextureFormat(g, iF, f, t) {
    const tex = g.createTexture();
    g.bindTexture(g.TEXTURE_2D, tex);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texImage2D(g.TEXTURE_2D, 0, iF, 4, 4, 0, f, t, null);
    const fbo = g.createFramebuffer();
    g.bindFramebuffer(g.FRAMEBUFFER, fbo);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, tex, 0);
    return g.checkFramebufferStatus(g.FRAMEBUFFER) === g.FRAMEBUFFER_COMPLETE;
  }

  // ── Shader compilation ──
  let baseVertexShader, copyProgram, clearProgram, splatProgram, advectionProgram;
  let divergenceProgram, curlProgram, vorticityProgram, pressureProgram, gradientSubtractProgram;
  let displayMaterial;
  let blit;

  function compileShader(type, source, keywords) {
    if (keywords) {
      let kw = ''; keywords.forEach(k => kw += '#define ' + k + '\n');
      source = kw + source;
    }
    const s = gl.createShader(type);
    gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  }

  function createProgram(vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p));
    const uniforms = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i).name;
      uniforms[name] = gl.getUniformLocation(p, name);
    }
    return { program: p, uniforms, bind() { gl.useProgram(p); } };
  }

  const baseVS = `precision highp float;attribute vec2 aPosition;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform vec2 texelSize;void main(){vUv=aPosition*0.5+0.5;vL=vUv-vec2(texelSize.x,0);vR=vUv+vec2(texelSize.x,0);vT=vUv+vec2(0,texelSize.y);vB=vUv-vec2(0,texelSize.y);gl_Position=vec4(aPosition,0,1);}`;
  const copyFS = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;uniform sampler2D uTexture;void main(){gl_FragColor=texture2D(uTexture,vUv);}`;
  const clearFS = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;uniform sampler2D uTexture;uniform float value;void main(){gl_FragColor=value*texture2D(uTexture,vUv);}`;
  const splatFS = `precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uTarget;uniform float aspectRatio;uniform vec3 color;uniform vec2 point;uniform float radius;void main(){vec2 p=vUv-point.xy;p.x*=aspectRatio;vec3 splat=exp(-dot(p,p)/radius)*color;vec3 base=texture2D(uTarget,vUv).xyz;gl_FragColor=vec4(base+splat,1.0);}`;
  const advectionFS = `precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uVelocity;uniform sampler2D uSource;uniform vec2 texelSize;uniform vec2 dyeTexelSize;uniform float dt;uniform float dissipation;void main(){vec2 coord=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;vec4 result=texture2D(uSource,coord);float decay=1.0+dissipation*dt;gl_FragColor=result/decay;}`;
  const divergenceFS = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).x;float R=texture2D(uVelocity,vR).x;float T=texture2D(uVelocity,vT).y;float B=texture2D(uVelocity,vB).y;vec2 C=texture2D(uVelocity,vUv).xy;if(vL.x<0.0)L=-C.x;if(vR.x>1.0)R=-C.x;if(vT.y>1.0)T=-C.y;if(vB.y<0.0)B=-C.y;float div=0.5*(R-L+T-B);gl_FragColor=vec4(div,0,0,1);}`;
  const curlFS = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).y;float R=texture2D(uVelocity,vR).y;float T=texture2D(uVelocity,vT).x;float B=texture2D(uVelocity,vB).x;float v=R-L-T+B;gl_FragColor=vec4(0.5*v,0,0,1);}`;
  const vorticityFS = `precision highp float;precision highp sampler2D;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uVelocity;uniform sampler2D uCurl;uniform float curl;uniform float dt;void main(){float L=texture2D(uCurl,vL).x;float R=texture2D(uCurl,vR).x;float T=texture2D(uCurl,vT).x;float B=texture2D(uCurl,vB).x;float C=texture2D(uCurl,vUv).x;vec2 force=0.5*vec2(abs(T)-abs(B),abs(R)-abs(L));force/=length(force)+0.0001;force*=curl*C;force.y*=-1.0;vec2 velocity=texture2D(uVelocity,vUv).xy;velocity+=force*dt;velocity=min(max(velocity,-1000.0),1000.0);gl_FragColor=vec4(velocity,0,1);}`;
  const pressureFS = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uPressure;uniform sampler2D uDivergence;void main(){float L=texture2D(uPressure,vL).x;float R=texture2D(uPressure,vR).x;float T=texture2D(uPressure,vT).x;float B=texture2D(uPressure,vB).x;float divergence=texture2D(uDivergence,vUv).x;float pressure=(L+R+B+T-divergence)*0.25;gl_FragColor=vec4(pressure,0,0,1);}`;
  const gradientFS = `precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uPressure;uniform sampler2D uVelocity;void main(){float L=texture2D(uPressure,vL).x;float R=texture2D(uPressure,vR).x;float T=texture2D(uPressure,vT).x;float B=texture2D(uPressure,vB).x;vec2 velocity=texture2D(uVelocity,vUv).xy;velocity.xy-=vec2(R-L,T-B);gl_FragColor=vec4(velocity,0,1);}`;
  const displayFS = `precision highp float;precision highp sampler2D;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uTexture;uniform vec2 texelSize;void main(){vec3 c=texture2D(uTexture,vUv).rgb;
#ifdef SHADING
vec3 lc=texture2D(uTexture,vL).rgb;vec3 rc=texture2D(uTexture,vR).rgb;vec3 tc=texture2D(uTexture,vT).rgb;vec3 bc=texture2D(uTexture,vB).rgb;float dx=length(rc)-length(lc);float dy=length(tc)-length(bc);vec3 n=normalize(vec3(dx,dy,length(texelSize)));vec3 l=vec3(0,0,1);float diffuse=clamp(dot(n,l)+0.7,0.7,1.0);c*=diffuse;
#endif
float a=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c,a);}`;

  function compileAllShaders() {
    baseVertexShader = compileShader(gl.VERTEX_SHADER, baseVS);
    copyProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, copyFS));
    clearProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, clearFS));
    splatProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, splatFS));
    advectionProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, advectionFS));
    divergenceProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, divergenceFS));
    curlProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, curlFS));
    vorticityProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, vorticityFS));
    pressureProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, pressureFS));
    gradientSubtractProgram = createProgram(baseVertexShader, compileShader(gl.FRAGMENT_SHADER, gradientFS));

    // Display material with keyword support
    displayMaterial = {
      program: null, uniforms: null,
      setKeywords(kw) {
        const fs = compileShader(gl.FRAGMENT_SHADER, displayFS, kw);
        const p = createProgram(baseVertexShader, fs);
        this.program = p.program; this.uniforms = p.uniforms;
      },
      bind() { gl.useProgram(this.program); }
    };

    // Blit quad
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,1,1,-1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,0,2,3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    blit = (target, clear) => {
      if (!target) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      if (clear) { gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT); }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };
  }

  // ── Framebuffers ──
  let dye, velocity, divergence, curl_fb, pressure_fb;

  function createFBO(w, h, iF, f, t, param) {
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, iF, w, h, 0, f, t, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture: tex, fbo, width: w, height: h, texelSizeX: 1/w, texelSizeY: 1/h, attach(id) { gl.activeTexture(gl.TEXTURE0+id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; } };
  }

  function createDoubleFBO(w, h, iF, f, t, param) {
    let fbo1 = createFBO(w, h, iF, f, t, param);
    let fbo2 = createFBO(w, h, iF, f, t, param);
    return { width: w, height: h, texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY, get read() { return fbo1; }, set read(v) { fbo1 = v; }, get write() { return fbo2; }, set write(v) { fbo2 = v; }, swap() { let t = fbo1; fbo1 = fbo2; fbo2 = t; } };
  }

  function getResolution(res) {
    let ar = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (ar < 1) ar = 1 / ar;
    const min = Math.round(res), max = Math.round(res * ar);
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
  }

  function initFramebuffers() {
    const simRes = getResolution(config.SIM_RESOLUTION);
    const dyeRes = getResolution(config.DYE_RESOLUTION);
    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA, rg = ext.formatRG, r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
    gl.disable(gl.BLEND);
    dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
    velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
    divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    curl_fb = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    pressure_fb = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
  }

  function updateKeywords() {
    const kw = [];
    if (config.SHADING) kw.push('SHADING');
    displayMaterial.setKeywords(kw);
  }

  // ── Simulation Loop ──
  let lastUpdateTime, colorUpdateTimer = 0;

  function updateFrame() {
    if (!isActive) return;
    const dt = calcDeltaTime();
    if (resizeCanvas()) initFramebuffers();
    updateColors(dt);
    applyInputs();
    step(dt);
    render();
    animId = requestAnimationFrame(updateFrame);
  }

  function calcDeltaTime() {
    const now = Date.now();
    let dt = (now - lastUpdateTime) / 1000;
    dt = Math.min(dt, 0.016666);
    lastUpdateTime = now;
    return dt;
  }

  function resizeCanvas() {
    const pr = window.devicePixelRatio || 1;
    const w = Math.floor(canvas.clientWidth * pr);
    const h = Math.floor(canvas.clientHeight * pr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
    return false;
  }

  function updateColors(dt) {
    colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
    if (colorUpdateTimer >= 1) {
      colorUpdateTimer %= 1;
      pointers.forEach(p => p.color = generateColor());
    }
  }

  function applyInputs() {
    pointers.forEach(p => { if (p.moved) { p.moved = false; splatPointer(p); } });
  }

  function step(dt) {
    gl.disable(gl.BLEND);
    curlProgram.bind(); gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY); gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0)); blit(curl_fb);
    vorticityProgram.bind(); gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY); gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0)); gl.uniform1i(vorticityProgram.uniforms.uCurl, curl_fb.attach(1)); gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL); gl.uniform1f(vorticityProgram.uniforms.dt, dt); blit(velocity.write); velocity.swap();
    divergenceProgram.bind(); gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY); gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0)); blit(divergence);
    clearProgram.bind(); gl.uniform1i(clearProgram.uniforms.uTexture, pressure_fb.read.attach(0)); gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE); blit(pressure_fb.write); pressure_fb.swap();
    pressureProgram.bind(); gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY); gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) { gl.uniform1i(pressureProgram.uniforms.uPressure, pressure_fb.read.attach(1)); blit(pressure_fb.write); pressure_fb.swap(); }
    gradientSubtractProgram.bind(); gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY); gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure_fb.read.attach(0)); gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1)); blit(velocity.write); velocity.swap();
    advectionProgram.bind(); gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY); let vid = velocity.read.attach(0); gl.uniform1i(advectionProgram.uniforms.uVelocity, vid); gl.uniform1i(advectionProgram.uniforms.uSource, vid); gl.uniform1f(advectionProgram.uniforms.dt, dt); gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION); blit(velocity.write); velocity.swap();
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0)); gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1)); gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION); blit(dye.write); dye.swap();
  }

  function render() {
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.enable(gl.BLEND);
    displayMaterial.bind();
    if (config.SHADING) gl.uniform2f(displayMaterial.uniforms.texelSize, 1/gl.drawingBufferWidth, 1/gl.drawingBufferHeight);
    gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
    blit(null);
  }

  function splatPointer(pointer) {
    splat(pointer.texcoordX, pointer.texcoordY, pointer.deltaX * config.SPLAT_FORCE, pointer.deltaY * config.SPLAT_FORCE, pointer.color);
  }

  function splat(x, y, dx, dy, color) {
    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatProgram.uniforms.point, x, y);
    gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0);
    gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100));
    blit(velocity.write); velocity.swap();
    gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
    gl.uniform3f(splatProgram.uniforms.color, color.r || color[0], color.g || color[1], color.b || color[2]);
    blit(dye.write); dye.swap();
  }

  function correctRadius(r) { if (canvas.width / canvas.height > 1) r *= canvas.width / canvas.height; return r; }

  function generateColor() {
    const h = Math.random(), s = 1, v = 1;
    const c = HSVtoRGB(h, s, v);
    c.r *= 0.15; c.g *= 0.15; c.b *= 0.15;
    return c;
  }

  function HSVtoRGB(h, s, v) {
    let r, g, b; const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    switch (i % 6) { case 0: r=v;g=t;b=p;break; case 1: r=q;g=v;b=p;break; case 2: r=p;g=v;b=t;break; case 3: r=p;g=q;b=v;break; case 4: r=t;g=p;b=v;break; case 5: r=v;g=p;b=q;break; }
    return { r, g, b };
  }

  // ── Events ──
  function bindEvents() {
    const pr = window.devicePixelRatio || 1;
    canvas.addEventListener('mousemove', e => {
      const p = pointers[0];
      const posX = Math.floor(e.clientX * pr), posY = Math.floor(e.clientY * pr);
      p.prevTexcoordX = p.texcoordX; p.prevTexcoordY = p.texcoordY;
      p.texcoordX = posX / canvas.width; p.texcoordY = 1 - posY / canvas.height;
      p.deltaX = correctDeltaX(p.texcoordX - p.prevTexcoordX);
      p.deltaY = correctDeltaY(p.texcoordY - p.prevTexcoordY);
      p.moved = Math.abs(p.deltaX) > 0 || Math.abs(p.deltaY) > 0;
      if (!p.color || !p.color.r) p.color = generateColor();
    });

    canvas.addEventListener('mousedown', e => {
      const p = pointers[0];
      const pr2 = window.devicePixelRatio || 1;
      p.texcoordX = Math.floor(e.clientX * pr2) / canvas.width;
      p.texcoordY = 1 - Math.floor(e.clientY * pr2) / canvas.height;
      p.color = generateColor();
      const c = { ...p.color }; c.r *= 10; c.g *= 10; c.b *= 10;
      splat(p.texcoordX, p.texcoordY, 10*(Math.random()-0.5), 30*(Math.random()-0.5), c);
    });

    canvas.addEventListener('touchstart', e => {
      const touches = e.targetTouches;
      const pr2 = window.devicePixelRatio || 1;
      for (let i = 0; i < touches.length; i++) {
        const p = pointers[0];
        p.texcoordX = Math.floor(touches[i].clientX * pr2) / canvas.width;
        p.texcoordY = 1 - Math.floor(touches[i].clientY * pr2) / canvas.height;
        p.color = generateColor();
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', e => {
      const touches = e.targetTouches;
      const pr2 = window.devicePixelRatio || 1;
      const p = pointers[0];
      const posX = Math.floor(touches[0].clientX * pr2), posY = Math.floor(touches[0].clientY * pr2);
      p.prevTexcoordX = p.texcoordX; p.prevTexcoordY = p.texcoordY;
      p.texcoordX = posX / canvas.width; p.texcoordY = 1 - posY / canvas.height;
      p.deltaX = correctDeltaX(p.texcoordX - p.prevTexcoordX);
      p.deltaY = correctDeltaY(p.texcoordY - p.prevTexcoordY);
      p.moved = Math.abs(p.deltaX) > 0 || Math.abs(p.deltaY) > 0;
      if (!p.color || !p.color.r) p.color = generateColor();
    }, { passive: true });
  }

  function correctDeltaX(d) { const ar = canvas.width / canvas.height; if (ar < 1) d *= ar; return d; }
  function correctDeltaY(d) { const ar = canvas.width / canvas.height; if (ar > 1) d /= ar; return d; }

  return { init };
})();
