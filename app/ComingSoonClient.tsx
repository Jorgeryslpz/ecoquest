"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import "./coming-soon.css";

// Fecha en que arranca la barra de progreso (para calcular el % avanzado)
// y fecha/hora real de lanzamiento (hora de Ciudad de México, UTC-6).
// Cambia estas dos constantes si la fecha se mueve — no hay que tocar nada
// más del componente.
const START = new Date("2026-10-01T00:00:00-06:00").getTime();
const TARGET = new Date("2026-11-01T00:00:00-06:00").getTime();

export default function ComingSoonClient() {
  const symsRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const pendRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const ddRef = useRef<HTMLElement>(null);
  const hhRef = useRef<HTMLElement>(null);
  const mmRef = useRef<HTMLElement>(null);
  const ssRef = useRef<HTMLElement>(null);
  const progRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Textura de grano: antes venía embebida en base64 en el <script>; aquí
    // vive como archivo real en /grain.png, pero se sigue aplicando igual
    // (variable CSS --grain-url en <html>).
    document.documentElement.style.setProperty("--grain-url", "url(/grain.png)");

    /* símbolos flotantes */
    const syms = "? + − × ÷ % √ π =".split(" ");
    const box = symsRef.current!;
    let html = "";
    for (let i = 0; i < 16; i++) {
      const z = 24 + Math.random() * 54;
      const t = (6 + Math.random() * 7).toFixed(1);
      html +=
        '<span class="sym" style="left:' +
        (Math.random() * 100).toFixed(1) +
        "%;top:" +
        (Math.random() * 100).toFixed(1) +
        "%;font-size:" +
        Math.round(z) +
        "px;--t:" +
        t +
        "s;animation-delay:-" +
        (Math.random() * 7).toFixed(1) +
        's">' +
        syms[i % syms.length] +
        "</span>";
    }
    box.innerHTML = html;

    /* spotlight del cursor (solo en dispositivos con mouse) */
    let onPointerMove: ((e: PointerEvent) => void) | null = null;
    if (matchMedia("(pointer:fine)").matches) {
      const spot = spotRef.current!;
      onPointerMove = (e: PointerEvent) => {
        spot.style.setProperty("--x", e.clientX + "px");
        spot.style.setProperty("--y", e.clientY + "px");
      };
      addEventListener("pointermove", onPointerMove);
    }

    /* cuenta regresiva */
    const pend = pendRef.current!;
    const done = doneRef.current!;
    const dd = ddRef.current!;
    const hh = hhRef.current!;
    const mm = mmRef.current!;
    const ss = ssRef.current!;
    const prog = progRef.current!;
    const pad = (n: number) => String(n).padStart(2, "0");

    function setDigit(el: HTMLElement, val: string) {
      if (el.textContent === val) return;
      el.textContent = val;
      el.classList.remove("pop");
      void el.offsetWidth;
      el.classList.add("pop");
    }

    function burstConfetti() {
      const cols = ["#F0904E", "#FFB27A", "#F5F1EA", "#232F52"];
      for (let i = 0; i < 26; i++) {
        const c = document.createElement("i");
        const a = Math.random() * Math.PI * 2;
        const d = 140 + Math.random() * 300;
        c.className = "confetti";
        c.style.cssText =
          "--dx:" +
          Math.cos(a) * d +
          "px;--dy:" +
          Math.sin(a) * d +
          "px;--r:" +
          (Math.random() * 720 - 360) +
          "deg;background:" +
          cols[i % cols.length];
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 1000);
      }
    }

    // Declarado antes de llamar tick() por primera vez: si TARGET ya pasó
    // (alguien visita la página después del lanzamiento), tick() limpia el
    // intervalo en su primera corrida síncrona, antes de que `timer` se
    // asigne más abajo — con `let` adelantado esto no truena (con `const`
    // sí, por el temporal dead zone).
    // eslint-disable-next-line prefer-const -- debe ser `let` por el TDZ explicado arriba
    let timer: ReturnType<typeof setInterval>;

    function tick() {
      const now = Date.now();
      const diff = TARGET - now;
      const pct = Math.min(100, Math.max(0, ((now - START) / (TARGET - START)) * 100));
      prog.style.setProperty("--pw", pct.toFixed(2) + "%");

      if (diff <= 0) {
        if (!pend.classList.contains("hidden")) burstConfetti();
        pend.classList.add("hidden");
        done.classList.remove("hidden");
        clearInterval(timer);
        return;
      }
      const s = Math.floor(diff / 1000);
      setDigit(dd, pad(Math.floor(s / 86400)));
      setDigit(hh, pad(Math.floor((s % 86400) / 3600)));
      setDigit(mm, pad(Math.floor((s % 3600) / 60)));
      setDigit(ss, pad(s % 60));
    }
    tick();
    timer = setInterval(tick, 1000);

    return () => {
      clearInterval(timer);
      if (onPointerMove) removeEventListener("pointermove", onPointerMove);
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

      <div className="grain" aria-hidden="true"></div>
      <div className="spot" id="spot" ref={spotRef} aria-hidden="true"></div>

      <main>
        <div className="aurora" aria-hidden="true">
          <i className="a1"></i>
          <i className="a2"></i>
          <i className="a3"></i>
        </div>
        <div className="vign" aria-hidden="true"></div>
        <div id="syms" ref={symsRef} aria-hidden="true"></div>

        <div className="in">
          <div className="logo">
            <span className="tile">K</span>
            <span>
              KAAN<em>KI</em>
            </span>
          </div>

          <div className="mascot-wrap">
            <div className="mhalo" aria-hidden="true"></div>
            <img className="mascot" alt="" src="/mascota.png" />
          </div>

          <div id="pending" ref={pendRef}>
            <p className="kick">
              Muy pronto
              <i aria-hidden="true"></i>
            </p>
            <h1>
              <span className="w" style={{ ["--i" as string]: 0 } as React.CSSProperties}>
                Tu
              </span>{" "}
              <span className="w" style={{ ["--i" as string]: 1 } as React.CSSProperties}>
                aventura
              </span>{" "}
              <span className="w" style={{ ["--i" as string]: 2 } as React.CSSProperties}>
                rumbo
              </span>{" "}
              <span className="w" style={{ ["--i" as string]: 3 } as React.CSSProperties}>
                a
              </span>{" "}
              <span className="w" style={{ ["--i" as string]: 4 } as React.CSSProperties}>
                la
              </span>{" "}
              <em>
                <span className="w" style={{ ["--i" as string]: 5 } as React.CSSProperties}>
                  prepa
                </span>{" "}
                <span className="w" style={{ ["--i" as string]: 6 } as React.CSSProperties}>
                  que
                </span>{" "}
                <span className="w" style={{ ["--i" as string]: 7 } as React.CSSProperties}>
                  quieres.
                </span>
              </em>
            </h1>
            <p className="sub">
              Construyendo el camino hacia la prepa que quieres, paso a paso, reto a reto. Nos vemos muy pronto.
            </p>

            <div className="clockwrap">
              <div className="clock" role="timer" aria-live="off">
                <div className="unit">
                  <div className="box">
                    <b id="dd" ref={ddRef}>
                      00
                    </b>
                  </div>
                  <span>Días</span>
                </div>
                <div className="sep">:</div>
                <div className="unit">
                  <div className="box">
                    <b id="hh" ref={hhRef}>
                      00
                    </b>
                  </div>
                  <span>Horas</span>
                </div>
                <div className="sep">:</div>
                <div className="unit">
                  <div className="box">
                    <b id="mm" ref={mmRef}>
                      00
                    </b>
                  </div>
                  <span>Min</span>
                </div>
                <div className="sep">:</div>
                <div className="unit">
                  <div className="box">
                    <b id="ss" ref={ssRef}>
                      00
                    </b>
                  </div>
                  <span>Seg</span>
                </div>
              </div>
              <div className="track" aria-hidden="true">
                <i id="prog" ref={progRef}></i>
              </div>
            </div>

            <div className="date">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="16" rx="2"></rect>
                <path d="M8 3v4M16 3v4M3 10h18"></path>
              </svg>
              1 de noviembre, 2026
            </div>
          </div>

          <div id="done" ref={doneRef} className="done hidden">
            <p className="kick">Ya estamos aquí</p>
            <h1>
              Kaanki ya <em>está listo.</em>
            </h1>
            <p className="sub">Crea tu cuenta y haz tu diagnóstico de 55 preguntas.</p>
            <Link className="cta" href="/">
              Entrar a Kaanki
            </Link>
          </div>
        </div>

        <footer>kaanki.com · contacto@kaanki.com</footer>
      </main>
    </>
  );
}
