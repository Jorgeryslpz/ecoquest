"use client";

import { useEffect } from "react";
import Link from "next/link";
import "./landing.css";

// Estilos en línea que usan custom properties de CSS (--i, --len, --y, --d).
// React tipa `style` sin índice arbitrario, así que se castea explícitamente.
function cv(vars: Record<string, string | number>): React.CSSProperties {
  return vars as React.CSSProperties;
}

// Elemento del DOM con las propiedades ad-hoc (_a, _u, _p, _f, _hook, _r) que
// usa el script original para llevar estado de la animación por escena.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ext = HTMLElement & Record<string, any>;

export default function LandingClient() {
  useEffect(() => {
    const $ = (s: string, r: ParentNode = document): Ext => r.querySelector(s) as Ext;
    const $$ = (s: string, r: ParentNode = document): Ext[] => Array.from(r.querySelectorAll(s)) as Ext[];
    const root = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let flat = false;
    let raf = 0;
    let curIdx = 0;

    const bar = $("#bar");
    const portal = $("#portal");
    const cutEl = $("#cut");
    const menu = $("#menu");
    const burger = $("#burger");
    const flatBtn = $("#flatBtn");
    const hero = $(".hero");

    const SECS: [string, string][] = [
      ["inicio", "Inicio"],
      ["diagnostico", "Diagnóstico"],
      ["practica", "Practica"],
      ["compite", "Compite"],
      ["racha", "Racha"],
      ["simulador", "Simulador"],
      ["familias", "Familias y escuelas"],
      ["precios", "Precios"],
      ["preguntas", "Preguntas"],
    ];
    const secEls = SECS.map((s) => document.getElementById(s[0]));

    /* ---------- construir menú y puntos ---------- */
    $("#menuList").innerHTML = SECS.map(
      (s, i) =>
        `<li><a href="#${s[0]}" data-go="${s[0]}" style="--i:${i}"><small>${String(i).padStart(2, "0")}</small>${s[1]}</a></li>`
    ).join("");
    $("#dots").innerHTML = SECS.map(
      (s) => `<a href="#${s[0]}" data-go="${s[0]}" aria-label="${s[1]}"><span>${s[1]}</span></a>`
    ).join("");
    const dots = $$("#dots a");

    /* ---------- fondo del hero ---------- */
    const syms = "? + − × ÷ % √ π = A B C D ∑ ≠ 7 3 9".split(" ");
    $("#syms").innerHTML = Array.from({ length: 26 }, (_, i) => {
      const z = Math.round(10 + Math.random() * 40);
      const t = (6 + Math.random() * 8).toFixed(1);
      return `<span class="sym" style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;font-size:${Math.round(30 + Math.random() * 90)}px;--z:${z}px;--t:${t}s;animation-delay:-${(Math.random() * 8).toFixed(1)}s">${syms[i % syms.length]}</span>`;
    }).join("");

    const onPointerMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
      hero.style.setProperty("--my", (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
    };
    hero.addEventListener("pointermove", onPointerMove);

    /* ---------- anillo del diagnóstico (11 materias) ---------- */
    $("#ring").innerHTML = Array.from(
      { length: 11 },
      (_, i) =>
        `<circle class="seg" data-p-at="${(0.06 + i * 0.065).toFixed(3)}" cx="200" cy="200" r="168" pathLength="100" stroke-dasharray="7.6 92.4" transform="rotate(${(-90 + (i * 360) / 11).toFixed(2)} 200 200)"/>`
    ).join("");

    /* ---------- escenas: progreso, pasos y contadores ---------- */
    const scenes = $$(".scene");
    scenes.forEach((sc) => {
      sc._at = $$("[data-p-at]", sc).map((el) => {
        el._a = parseFloat(el.dataset.pAt!);
        el._u = el.dataset.pUntil == null ? 9 : parseFloat(el.dataset.pUntil);
        return el;
      });
      sc._ct = $$("[data-count]", sc);
    });

    const fmt = (t: string | undefined, v: number) => {
      if (t === "time") {
        const s = Math.round(v);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const x = s % 60;
        return h + ":" + String(m).padStart(2, "0") + ":" + String(x).padStart(2, "0");
      }
      if (t === "plus") return "+" + Math.round(v).toLocaleString("en-US");
      return Math.round(v).toLocaleString("en-US");
    };

    function setP(sc: Ext, p: number) {
      p = Math.round(p * 1000) / 1000;
      if (sc._p === p && sc._f === flat) return;
      sc._p = p;
      sc._f = flat;
      sc.style.setProperty("--p", String(p));
      for (const el of sc._at as Ext[]) {
        el.classList.toggle("in", p >= el._a && p < el._u);
        el.classList.toggle("out", p >= el._u);
      }
      for (const el of sc._ct as Ext[]) {
        const p0 = parseFloat(el.dataset.p0 ?? "0");
        const p1 = parseFloat(el.dataset.p1 ?? ".8");
        const from = parseFloat(el.dataset.from ?? "0");
        const to = parseFloat(el.dataset.to!);
        const t = Math.min(1, Math.max(0, (p - p0) / (p1 - p0)));
        el.textContent = flat && el.dataset.flat ? el.dataset.flat : fmt(el.dataset.fmt, from + (to - from) * t);
      }
      if (sc._hook) sc._hook(p);
    }

    /* ---------- marcador que se reordena ---------- */
    const cmp = $("#compite");
    const rows = $$(".row", cmp);
    const me = $(".row.me", cmp);
    const others = rows.filter((r) => r !== me);
    function celebrate() {
      const w = $(".lbwrap", cmp);
      const st = $(".stage", cmp);
      st.classList.remove("shake");
      void st.offsetWidth;
      st.classList.add("shake");
      const cols = ["#F0904E", "#FFB27A", "#F5F1EA", "#232F52"];
      for (let i = 0; i < 32; i++) {
        const c = document.createElement("i");
        const a = Math.random() * Math.PI * 2;
        const d = 120 + Math.random() * 260;
        c.className = "cf";
        c.style.cssText = `--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--r:${Math.random() * 720 - 360}deg;--c:${cols[i % 4]}`;
        w.appendChild(c);
        setTimeout(() => c.remove(), 1000);
      }
    }
    cmp._hook = (p: number) => {
      const r = p < 0.26 ? 4 : p < 0.42 ? 3 : p < 0.58 ? 2 : p < 0.74 ? 1 : 0;
      if (cmp._r === r) return;
      const prev = cmp._r;
      cmp._r = r;
      me.style.setProperty("--y", String(r));
      $(".rk", me).textContent = String(r + 1);
      others.forEach((o, k) => {
        const pos = k < r ? k : k + 1;
        o.style.setProperty("--y", String(pos));
        $(".rk", o).textContent = String(pos + 1);
      });
      me.classList.toggle("first", r === 0);
      if (r === 0 && prev !== undefined && !flat) celebrate();
    };

    /* ---------- actualización por scroll ---------- */
    const pxEls = $$("[data-px]");
    function update() {
      raf = 0;
      const vh = innerHeight;
      const sy = scrollY;
      const max = Math.max(1, root.scrollHeight - vh);
      bar.style.transform = `scaleX(${Math.min(1, sy / max)})`;
      for (const sc of scenes) {
        const top = sc.getBoundingClientRect().top;
        setP(sc, flat ? 1 : Math.min(1, Math.max(0, -top / Math.max(1, sc.offsetHeight - vh))));
      }
      for (const el of pxEls) {
        const r = el.parentElement!.getBoundingClientRect();
        el.style.transform = `translate3d(${(r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.px!)}px,0,0)`;
      }
      let cur = 0;
      secEls.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= vh * 0.5) cur = i;
      });
      if (cur !== curIdx || !dots[cur].classList.contains("on")) {
        curIdx = cur;
        dots.forEach((d, i) => d.classList.toggle("on", i === cur));
      }
    }
    const req = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", req);

    /* ---------- revelado de secciones normales ---------- */
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    $$(".rv").forEach((el) => io.observe(el));

    /* ---------- bloqueo de scroll hasta "Comenzar" ---------- */
    const lock = () => root.classList.add("locked");
    const unlock = () => root.classList.remove("locked");

    const topOf = (el: Element) => el.getBoundingClientRect().top + scrollY;
    function jump(id: string, smooth: boolean, frac?: number) {
      const el = document.getElementById(id);
      if (!el) return;
      let y = topOf(el);
      if (!flat && el.classList.contains("scene")) y += ((el as HTMLElement).offsetHeight - innerHeight) * (frac ?? 0.9);
      scrollTo({ top: y, behavior: smooth ? "smooth" : "auto" });
    }
    function cut(fn: () => void) {
      cutEl.classList.add("on");
      setTimeout(() => {
        fn();
        requestAnimationFrame(() => cutEl.classList.remove("on"));
      }, 140);
    }
    function go(id: string) {
      closeMenu();
      unlock();
      cut(() => jump(id, false));
    }

    const onStartClick = (e: MouseEvent) => {
      if (flat || reduce) {
        unlock();
        jump("diagnostico", true, 0);
        return;
      }
      const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const S = (Math.hypot(innerWidth, innerHeight) * 2) / 20;
      portal.style.transition = "none";
      portal.style.left = b.left + b.width / 2 + "px";
      portal.style.top = b.top + b.height / 2 + "px";
      portal.style.transform = "scale(0)";
      void portal.offsetWidth;
      portal.style.transition = "transform .75s cubic-bezier(.7,0,.2,1)";
      portal.style.transform = `scale(${S})`;
      setTimeout(() => {
        unlock();
        jump("diagnostico", false, 0);
        portal.style.transition = "none";
        portal.style.left = "50%";
        portal.style.top = "50%";
        void portal.offsetWidth;
        portal.style.transition = "transform .8s cubic-bezier(.7,0,.2,1)";
        portal.style.transform = "scale(0)";
      }, 800);
    };
    $("#start").addEventListener("click", onStartClick);

    /* ---------- menú ---------- */
    function openMenu() {
      menu.inert = false;
      menu.setAttribute("aria-hidden", "false");
      menu.classList.add("open");
      burger.setAttribute("aria-expanded", "true");
    }
    function closeMenu() {
      menu.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
      menu.inert = true;
    }
    menu.inert = true;
    const onBurgerClick = () => (menu.classList.contains("open") ? closeMenu() : openMenu());
    burger.addEventListener("click", onBurgerClick);
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    addEventListener("keydown", onKeydown);
    const onDocClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("[data-go]") as HTMLElement | null;
      if (a) {
        e.preventDefault();
        go(a.dataset.go!);
        return;
      }
      const dead = (e.target as HTMLElement).closest('a[href="#"]');
      if (dead) e.preventDefault();
    };
    document.addEventListener("click", onDocClick);

    /* ---------- modo simple (sin animaciones) ---------- */
    function setFlat(v: boolean) {
      const id = SECS[curIdx][0];
      flat = v;
      root.classList.toggle("flat", v);
      flatBtn.textContent = v ? "Volver a la experiencia" : "Ver sin animaciones";
      unlock();
      update();
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) scrollTo({ top: topOf(el), behavior: "auto" });
        update();
      });
    }
    const onFlatClick = () => {
      setFlat(!flat);
      closeMenu();
    };
    flatBtn.addEventListener("click", onFlatClick);

    if (reduce) {
      flat = true;
      root.classList.add("flat");
      flatBtn.textContent = "Volver a la experiencia";
    } else {
      lock();
    }
    update();

    return () => {
      removeEventListener("scroll", req);
      removeEventListener("resize", req);
      removeEventListener("keydown", onKeydown);
      document.removeEventListener("click", onDocClick);
      hero.removeEventListener("pointermove", onPointerMove);
      burger.removeEventListener("click", onBurgerClick);
      flatBtn.removeEventListener("click", onFlatClick);
      $("#start")?.removeEventListener("click", onStartClick);
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      root.classList.remove("locked", "flat");
    };
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />

      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
        <symbol id="i-check" viewBox="0 0 24 24">
          <path d="M5 12l4 4 10-10" />
        </symbol>
        <symbol id="i-book" viewBox="0 0 24 24">
          <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 1 2-2h13" />
        </symbol>
        <symbol id="i-card" viewBox="0 0 24 24">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
        </symbol>
        <symbol id="i-shield" viewBox="0 0 24 24">
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4" />
        </symbol>
        <symbol id="i-mail" viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </symbol>
        <symbol id="i-trophy" viewBox="0 0 24 24">
          <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6" />
        </symbol>
        <symbol id="i-users" viewBox="0 0 24 24">
          <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.5M17.5 14.5A6 6 0 0 1 21 20" />
        </symbol>
        <symbol id="i-chart" viewBox="0 0 24 24">
          <path d="M5 20V10M12 20V4M19 20v-7" />
        </symbol>
        <symbol id="i-down" viewBox="0 0 24 24">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </symbol>
      </svg>

      <div id="bar" />
      <div id="portal" />
      <div id="cut" />

      <header id="top">
        <button className="logo" type="button" data-go="inicio" aria-label="Kaanki, ir al inicio">
          <span className="tile">K</span>
          <span>
            KAAN<i>KI</i>
          </span>
        </button>
        <div className="topr">
          <Link className="btn navy login" href="/login">
            Iniciar sesión
          </Link>
          <button id="burger" type="button" aria-label="Menú" aria-expanded="false" aria-controls="menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <nav id="menu" className="menu" aria-label="Secciones" aria-hidden="true">
        <ol id="menuList"></ol>
        <div className="menu-foot">
          <button id="flatBtn" className="btn ghost" type="button">
            Ver sin animaciones
          </button>
          <Link className="btn navy" href="/login">
            Iniciar sesión
          </Link>
          <Link className="btn" href="/registro">
            Crear cuenta
          </Link>
        </div>
      </nav>

      <nav id="dots" aria-label="Capítulos"></nav>

      <main>
        {/* ============ INICIO ============ */}
        <section id="inicio" className="hero">
          <div className="orb" aria-hidden="true"></div>
          <div id="syms" aria-hidden="true"></div>
          <div className="hero-in">
            <h1>
              <span className="w" style={cv({ "--i": 0 })}>
                Tu
              </span>{" "}
              <span className="w" style={cv({ "--i": 1 })}>
                aventura
              </span>{" "}
              <span className="w" style={cv({ "--i": 2 })}>
                rumbo
              </span>{" "}
              <span className="w" style={cv({ "--i": 3 })}>
                a
              </span>{" "}
              <span className="w" style={cv({ "--i": 4 })}>
                la
              </span>{" "}
              <em>
                <span className="w" style={cv({ "--i": 5 })}>
                  prepa
                </span>{" "}
                <span className="w" style={cv({ "--i": 6 })}>
                  que
                </span>{" "}
                <span className="w" style={cv({ "--i": 7 })}>
                  quieres.
                </span>
              </em>
            </h1>
            <p className="sub">+2,000 reactivos. 11 materias. Un mapa.</p>
            <button id="start" className="btn big" type="button">
              Comenzar{" "}
              <svg className="ic" aria-hidden="true">
                <use href="#i-arrow" />
              </svg>
            </button>
          </div>
        </section>

        {/* ============ 01 DIAGNÓSTICO ============ */}
        <section id="diagnostico" className="scene" style={cv({ "--len": 340 })}>
          <div className="stage">
            <div className="bignum" aria-hidden="true">
              01
            </div>
            <div className="col text">
              <p className="kick pop" data-p-at="0">
                01 · Diagnóstico
              </p>
              <div className="sw">
                <h2 className="h2 pop" data-p-at="0" data-p-until=".55">
                  Primero, saber <em>dónde estás.</em>
                </h2>
                <h2 className="h2 pop" data-p-at=".55">
                  Y ya sabes por <em>dónde empezar.</em>
                </h2>
              </div>
              <p className="lead pop" data-p-at=".05">
                Un diagnóstico de 55 preguntas repasa tus 11 materias para trazar tu ruta.
              </p>
              <div className="badge pop" data-p-at=".88">
                <svg className="ic" aria-hidden="true">
                  <use href="#i-check" />
                </svg>
                Tu ruta está trazada
              </div>
            </div>
            <div className="col vis">
              <div className="ringwrap">
                <svg viewBox="0 0 400 400" aria-hidden="true">
                  <g id="ring"></g>
                </svg>
                <div className="ringc">
                  <b data-count="" data-to="55" data-p0=".05" data-p1=".7">
                    0
                  </b>
                  <span>preguntas</span>
                </div>
              </div>
            </div>
            <div className="hint pop" data-p-at="0" data-p-until=".08">
              <span>Sigue bajando</span>
              <svg className="ic" aria-hidden="true">
                <use href="#i-down" />
              </svg>
            </div>
          </div>
        </section>

        {/* ============ 02 PRACTICA ============ */}
        <section id="practica" className="scene" style={cv({ "--len": 420 })}>
          <div className="stage alt">
            <div className="bignum" aria-hidden="true">
              02
            </div>
            <div className="col text">
              <p className="kick pop" data-p-at="0">
                02 · Practica
              </p>
              <div className="sw">
                <h2 className="h2 pop" data-p-at="0" data-p-until=".35">
                  Una materia <em>a la vez.</em>
                </h2>
                <h2 className="h2 pop" data-p-at=".35" data-p-until=".7">
                  Un reto <em>tras otro.</em>
                </h2>
                <h2 className="h2 pop" data-p-at=".7">
                  Tu progreso, <em>siempre contigo.</em>
                </h2>
              </div>
              <p className="lead pop" data-p-at=".05">
                Sesiones de 20 preguntas por materia y un mapa de retos donde tu avance se guarda en tu cuenta.
              </p>
              <div className="stats">
                <div className="stat pop" data-p-at=".12">
                  <b data-count="" data-to="2000" data-fmt="plus" data-p0=".12" data-p1=".55">
                    +0
                  </b>
                  <span>reactivos</span>
                </div>
                <div className="stat pop" data-p-at=".22">
                  <b data-count="" data-to="11" data-p0=".22" data-p1=".5">
                    0
                  </b>
                  <span>materias</span>
                </div>
              </div>
            </div>
            <div className="col vis">
              <div className="phone">
                <div className="ptitle">Mundo de Preguntas</div>
                <svg viewBox="0 0 300 520" aria-hidden="true">
                  <path
                    className="trail"
                    pathLength="100"
                    d="M80 450 C80 420 220 420 220 380 C220 340 80 350 80 310 C80 270 220 280 220 240 C220 200 80 210 80 170 C80 130 220 140 220 100"
                  />
                  <path
                    className="trail on"
                    pathLength="100"
                    d="M80 450 C80 420 220 420 220 380 C220 340 80 350 80 310 C80 270 220 280 220 240 C220 200 80 210 80 170 C80 130 220 140 220 100"
                  />
                  <g transform="translate(80 450)">
                    <circle className="nb" r="26" />
                    <g className="pop" data-p-at=".10">
                      <circle className="nl" r="26" />
                      <path className="ck" d="M-9 0l6 6 12-12" />
                    </g>
                  </g>
                  <g transform="translate(220 380)">
                    <circle className="nb" r="26" />
                    <g className="pop" data-p-at=".24">
                      <circle className="nl" r="26" />
                      <path className="ck" d="M-9 0l6 6 12-12" />
                    </g>
                  </g>
                  <g transform="translate(80 310)">
                    <circle className="nb" r="26" />
                    <g className="pop" data-p-at=".38">
                      <circle className="nl" r="26" />
                      <path className="ck" d="M-9 0l6 6 12-12" />
                    </g>
                  </g>
                  <g transform="translate(220 240)">
                    <circle className="nb" r="26" />
                    <g className="pop" data-p-at=".52">
                      <circle className="nl" r="26" />
                      <path className="ck" d="M-9 0l6 6 12-12" />
                    </g>
                  </g>
                  <g transform="translate(80 170)">
                    <circle className="nb" r="26" />
                    <g className="pop" data-p-at=".66">
                      <circle className="nl" r="26" />
                      <path className="ck" d="M-9 0l6 6 12-12" />
                    </g>
                  </g>
                  <g transform="translate(220 100)">
                    <circle className="nb" r="34" />
                    <g className="pop" data-p-at=".80">
                      <circle className="nl halo" r="34" />
                      <path d="M-8 -12L14 0-8 12z" fill="#1a1208" />
                    </g>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 03 COMPITE ============ */}
        <section id="compite" className="scene" style={cv({ "--len": 420 })}>
          <div className="stage">
            <div className="bignum" aria-hidden="true">
              03
            </div>
            <div className="col text">
              <p className="kick pop" data-p-at="0">
                03 · Compite
              </p>
              <div className="sw">
                <h2 className="h2 pop" data-p-at="0" data-p-until=".5">
                  <em>Compite.</em>
                </h2>
                <h2 className="h2 pop" data-p-at=".5" data-p-until=".78">
                  Sube en el <em>marcador.</em>
                </h2>
                <h2 className="h2 pop" data-p-at=".78">
                  Llega al <em>primer lugar.</em>
                </h2>
              </div>
              <div className="tags">
                <div className="tag pop" data-p-at=".12">
                  <span className="ico">
                    <svg className="ic" aria-hidden="true">
                      <use href="#i-trophy" />
                    </svg>
                  </span>
                  <div>
                    <b>Arena</b>
                    <span>Duelos de preguntas y trofeos</span>
                  </div>
                </div>
                <div className="tag pop" data-p-at=".28">
                  <span className="ico">
                    <svg className="ic" aria-hidden="true">
                      <use href="#i-users" />
                    </svg>
                  </span>
                  <div>
                    <b>Grupos de estudio</b>
                    <span>Sumen puntos con tus amigos</span>
                  </div>
                </div>
                <div className="tag pop" data-p-at=".44">
                  <span className="ico">
                    <svg className="ic" aria-hidden="true">
                      <use href="#i-chart" />
                    </svg>
                  </span>
                  <div>
                    <b>Marcador global</b>
                    <span>Compárate con los demás estudiantes</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col vis">
              <div className="lbwrap">
                <div className="lb">
                  <div className="row" style={cv({ "--y": 0 })}>
                    <span className="rk">1</span>
                    <span className="av"></span>
                    <span className="nm">Rival 1</span>
                    <span className="bw">
                      <i style={{ width: "88%" }}></i>
                    </span>
                  </div>
                  <div className="row" style={cv({ "--y": 1 })}>
                    <span className="rk">2</span>
                    <span className="av"></span>
                    <span className="nm">Rival 2</span>
                    <span className="bw">
                      <i style={{ width: "74%" }}></i>
                    </span>
                  </div>
                  <div className="row" style={cv({ "--y": 2 })}>
                    <span className="rk">3</span>
                    <span className="av"></span>
                    <span className="nm">Rival 3</span>
                    <span className="bw">
                      <i style={{ width: "62%" }}></i>
                    </span>
                  </div>
                  <div className="row" style={cv({ "--y": 3 })}>
                    <span className="rk">4</span>
                    <span className="av"></span>
                    <span className="nm">Rival 4</span>
                    <span className="bw">
                      <i style={{ width: "50%" }}></i>
                    </span>
                  </div>
                  <div className="row me" style={cv({ "--y": 4 })}>
                    <span className="rk">5</span>
                    <span className="av"></span>
                    <span className="nm">Tú</span>
                    <svg className="ic tr" aria-hidden="true">
                      <use href="#i-trophy" />
                    </svg>
                    <span className="bw">
                      <i></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 04 RACHA ============ */}
        <section id="racha" className="scene" style={cv({ "--len": 320 })}>
          <div className="stage alt">
            <div className="bignum" aria-hidden="true">
              04
            </div>
            <div className="col text">
              <p className="kick pop" data-p-at="0">
                04 · Constancia
              </p>
              <div className="sw">
                <h2 className="h2 pop" data-p-at="0" data-p-until=".5">
                  Un poco <em>cada día.</em>
                </h2>
                <h2 className="h2 pop" data-p-at=".5">
                  Tu racha hace <em>el resto.</em>
                </h2>
              </div>
              <p className="lead pop" data-p-at=".1">
                Estudiar todos los días, aunque sea poco, le gana a los maratones de última hora.
              </p>
              <div className="stats">
                <div className="stat pop" data-p-at=".15">
                  <b data-count="" data-to="7" data-p0=".15" data-p1=".8">
                    0
                  </b>
                  <span>días seguidos</span>
                </div>
              </div>
            </div>
            <div className="col vis">
              <div className="flamebox">
                <svg className="flame" viewBox="0 0 200 260" aria-hidden="true">
                  <path
                    d="M100 10C110 60 170 90 170 160C170 215 138 250 100 250C62 250 30 215 30 160C30 120 55 100 68 78C72 100 84 108 92 100C102 80 92 50 100 10Z"
                    fill="#F0904E"
                  />
                  <path
                    d="M100 130C106 155 138 168 138 200C138 226 122 240 100 240C78 240 62 226 62 200C62 175 88 160 100 130Z"
                    fill="#FFD09E"
                  />
                </svg>
                <div className="days" aria-hidden="true">
                  <span className="day" data-p-at=".15">
                    L
                  </span>
                  <span className="day" data-p-at=".27">
                    M
                  </span>
                  <span className="day" data-p-at=".39">
                    M
                  </span>
                  <span className="day" data-p-at=".51">
                    J
                  </span>
                  <span className="day" data-p-at=".63">
                    V
                  </span>
                  <span className="day" data-p-at=".75">
                    S
                  </span>
                  <span className="day" data-p-at=".87">
                    D
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 05 SIMULADOR ============ */}
        <section id="simulador" className="scene" style={cv({ "--len": 400 })}>
          <div className="stage">
            <div className="bignum" aria-hidden="true">
              05
            </div>
            <div className="col text">
              <p className="kick pop" data-p-at="0">
                05 · Simulador
              </p>
              <div className="sw">
                <h2 className="h2 pop" data-p-at="0" data-p-until=".45">
                  El examen <em>completo.</em>
                </h2>
                <h2 className="h2 pop" data-p-at=".45" data-p-until=".85">
                  <em>128</em> reactivos. <em>3</em> horas.
                </h2>
                <h2 className="h2 pop" data-p-at=".85">
                  Como <em>el real.</em>
                </h2>
              </div>
              <p className="lead pop" data-p-at=".1">
                Practica con el tiempo encima para llegar sin sorpresas al día del examen.
              </p>
            </div>
            <div className="col vis">
              <div className="ringwrap">
                <svg viewBox="0 0 400 400" style={{ transform: "none" }} aria-hidden="true">
                  <circle cx="200" cy="200" r="176" fill="none" stroke="#2a2a32" strokeWidth="22" />
                  <circle className="tprog" cx="200" cy="200" r="176" pathLength="100" transform="rotate(-90 200 200)" />
                </svg>
                <div className="ringc">
                  <div className="tm" data-count="" data-from="10800" data-to="0" data-fmt="time" data-flat="3 h" data-p0=".1" data-p1=".92">
                    3:00:00
                  </div>
                  <div className="tcount">
                    Reactivo{" "}
                    <b data-count="" data-from="1" data-to="128" data-p0=".1" data-p1=".92">
                      1
                    </b>{" "}
                    de 128
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 06 FAMILIAS Y ESCUELAS ============ */}
        <section id="familias" className="scene" style={cv({ "--len": 340 })}>
          <div className="stage alt">
            <div className="bignum" aria-hidden="true">
              06
            </div>
            <div className="col text">
              <p className="kick pop" data-p-at="0">
                06 · Familias y escuelas
              </p>
              <h2 className="h2 pop" data-p-at="0">
                Cuidado para <em>sus familias.</em>
              </h2>
              <p className="lead pop" data-p-at=".05">
                Quien paga suele ser mamá, papá o tutor. Por eso somos claros en lo que ofrecemos y en cómo lo cuidamos.
              </p>
              <div className="school pop" data-p-at=".72">
                <h3>¿Quieres Kaanki en tu escuela?</h3>
                <p>Cuéntanos sobre tu escuela y platicamos cómo puede ayudar a tus estudiantes.</p>
                <span className="ph">contacto@kaanki.com</span>
                <a className="btn" href="mailto:contacto@kaanki.com">
                  Escríbenos
                </a>
              </div>
            </div>
            <div className="col trust">
              <div className="tc pop" data-p-at=".10">
                <span className="ico">
                  <svg className="ic" aria-hidden="true">
                    <use href="#i-book" />
                  </svg>
                </span>
                <h3>Contenido propio</h3>
                <p>Más de 2,000 reactivos en 11 materias, organizados para practicar por tema.</p>
              </div>
              <div className="tc pop" data-p-at=".25">
                <span className="ico">
                  <svg className="ic" aria-hidden="true">
                    <use href="#i-card" />
                  </svg>
                </span>
                <h3>Pagos con Stripe</h3>
                <p>El pago con tarjeta lo procesa Stripe en una página segura.</p>
              </div>
              <div className="tc pop" data-p-at=".40">
                <span className="ico">
                  <svg className="ic" aria-hidden="true">
                    <use href="#i-shield" />
                  </svg>
                </span>
                <h3>Competencia justa</h3>
                <p>Los puntajes y trofeos se calculan en el servidor: nadie puede inflar su marcador.</p>
              </div>
              <div className="tc pop" data-p-at=".55">
                <span className="ico">
                  <svg className="ic" aria-hidden="true">
                    <use href="#i-mail" />
                  </svg>
                </span>
                <h3>Cuentas confirmadas</h3>
                <p>Cada estudiante confirma su correo antes de empezar.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ INTERLUDIO ============ */}
        <section className="inter" aria-label="Próximamente">
          <div className="mq" data-px="-.6" aria-hidden="true">
            TUTORIA · TUTORIA · TUTORIA · TUTORIA · TUTORIA ·
          </div>
          <div className="mq fill" data-px=".6" aria-hidden="true">
            PRÓXIMAMENTE · PRÓXIMAMENTE · PRÓXIMAMENTE ·
          </div>
          <div className="mq" data-px="-.6" aria-hidden="true">
            BATALLA DE AULA · BATALLA DE AULA · BATALLA DE AULA ·
          </div>
          <p>En camino: TutorIA, tu tutor con inteligencia artificial, y Batalla de Aula en tiempo real.</p>
        </section>

        {/* ============ 07 PRECIOS ============ */}
        <section id="precios" className="pricing">
          <div className="phead rv">
            <p className="kick">07 · Precios</p>
            <h2 className="h2">
              Elige cuánto <em>quieres prepararte.</em>
            </h2>
            <p className="lead">Todos los planes incluyen todo Kaanki. Solo cambia la duración.</p>
          </div>
          <div className="cards">
            <div className="rv" style={cv({ "--d": "0s" })}>
              <div className="card">
                <div className="top">
                  <h3>Mensual</h3>
                </div>
                <div className="price">
                  <b>$149</b>
                  <span>MXN / mes</span>
                </div>
                <div className="peq">Pago mes a mes</div>
                <hr />
                <ul>
                  <li>
                    <svg className="ic" aria-hidden="true">
                      <use href="#i-check" />
                    </svg>
                    Las 11 materias y +2,000 reactivos
                  </li>
                  <li>
                    <svg className="ic" aria-hidden="true">
                      <use href="#i-check" />
                    </svg>
                    Diagnóstico y examen simulador
                  </li>
                  <li>
                    <svg className="ic" aria-hidden="true">
                      <use href="#i-check" />
                    </svg>
                    Arena, grupos y marcador global
                  </li>
                </ul>
                <Link className="btn navy" href="/registro?plan=1_mes">
                  Elegir mensual
                </Link>
              </div>
            </div>
            <div className="rv" style={cv({ "--d": ".15s" })}>
              <div className="card">
                <div className="top">
                  <h3>6 meses</h3>
                  <span className="save">Ahorras $345</span>
                </div>
                <div className="price">
                  <b>$549</b>
                  <span>MXN / 6 meses</span>
                </div>
                <div className="peq">Equivale a $91.50 al mes</div>
                <hr />
                <ul>
                  <li>
                    <svg className="ic" aria-hidden="true">
                      <use href="#i-check" />
                    </svg>
                    Las 11 materias y +2,000 reactivos
                  </li>
                  <li>
                    <svg className="ic" aria-hidden="true">
                      <use href="#i-check" />
                    </svg>
                    Diagnóstico y examen simulador
                  </li>
                  <li>
                    <svg className="ic" aria-hidden="true">
                      <use href="#i-check" />
                    </svg>
                    Arena, grupos y marcador global
                  </li>
                </ul>
                <Link className="btn navy" href="/registro?plan=6_meses">
                  Elegir 6 meses
                </Link>
              </div>
            </div>
            <div className="rv" style={cv({ "--d": ".3s" })}>
              <div className="card best">
                <span className="flag">Mejor precio</span>
                <div className="top">
                  <h3>Anual</h3>
                  <span className="save">Ahorras $839</span>
                </div>
                <div className="price">
                  <b>$949</b>
                  <span>MXN / año</span>
                </div>
                <div className="peq">Equivale a $79.08 al mes</div>
                <hr />
                <ul>
                  <li>
                    <svg className="ic" aria-hidden="true">
                      <use href="#i-check" />
                    </svg>
                    Las 11 materias y +2,000 reactivos
                  </li>
                  <li>
                    <svg className="ic" aria-hidden="true">
                      <use href="#i-check" />
                    </svg>
                    Diagnóstico y examen simulador
                  </li>
                  <li>
                    <svg className="ic" aria-hidden="true">
                      <use href="#i-check" />
                    </svg>
                    Arena, grupos y marcador global
                  </li>
                </ul>
                <Link className="btn" href="/registro?plan=1_anio">
                  Elegir anual
                </Link>
              </div>
            </div>
          </div>
          <p className="pnote rv" style={cv({ "--d": ".2s" })}>
            Precios en pesos mexicanos (MXN). El pago con tarjeta lo procesa Stripe y el cobro se realiza al momento de
            suscribirte.
          </p>
        </section>

        {/* ============ PREGUNTAS ============ */}
        <section id="preguntas" className="faq">
          <h2 className="h2 rv">
            Lo que solemos <em>escuchar.</em>
          </h2>
          <div className="rv" style={cv({ "--d": ".1s" })}>
            <details>
              <summary>
                ¿Para quién es Kaanki?
                <i></i>
              </summary>
              <div className="ans">
                Para estudiantes de 13 a 17 años que van a presentar el examen de ingreso a bachillerato (ECOEMS /
                COMIPEMS) en la Zona Metropolitana del Valle de México.
              </div>
            </details>
            <details>
              <summary>
                ¿Qué incluye la suscripción?
                <i></i>
              </summary>
              <div className="ans">
                Las 11 materias con más de 2,000 reactivos, el diagnóstico, el examen simulador, el Mundo de Preguntas,
                la Arena, los grupos de estudio y el marcador global.
              </div>
            </details>
            <details>
              <summary>
                ¿Cómo se paga?
                <i></i>
              </summary>
              <div className="ans">
                Con tarjeta, en una página segura de Stripe. El cobro se realiza al momento de suscribirte, y puedes
                elegir plan mensual, de 6 meses o anual.
              </div>
            </details>
            <details>
              <summary>
                ¿Funciona en el celular?
                <i></i>
              </summary>
              <div className="ans">
                Sí. Kaanki se abre desde el navegador, en celular o computadora, y tu progreso te sigue a donde vayas.
                Las apps para tiendas llegarán después.
              </div>
            </details>
            <details>
              <summary>
                ¿Habrá un tutor con inteligencia artificial?
                <i></i>
              </summary>
              <div className="ans">Sí, TutorIA está en camino para explicarte lo que no entiendas. Estará disponible próximamente.</div>
            </details>
            <p className="lead" style={{ maxWidth: "none" }}>
              ¿Otra duda? Escríbenos a contacto@kaanki.com y te respondemos.
            </p>
          </div>
        </section>

        {/* ============ CIERRE ============ */}
        <section className="final">
          <div className="panel rv">
            <div>
              <h2>Empieza hoy tu ruta a la prepa que quieres</h2>
              <p>Crea tu cuenta y haz el diagnóstico de 55 preguntas.</p>
              <Link className="btn navy big" href="/registro">
                Crear cuenta
              </Link>
            </div>
            <div className="mascot" aria-hidden="true">
              <img src="/mascota.png" alt="" style={{ width: "78%", height: "78%", objectFit: "contain" }} />
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span>© 2026 Kaanki · kaanki.com</span>
        <div>
          <Link href="/terminos">Términos y condiciones</Link>
          <Link href="/privacidad">Aviso de privacidad</Link>
          <span>contacto@kaanki.com</span>
        </div>
      </footer>
    </>
  );
}
