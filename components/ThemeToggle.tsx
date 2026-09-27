"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/lib/icons";

const STORAGE_KEY = "eq-theme";

export default function ThemeToggle() {
  const [claro, setClaro] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClaro(document.documentElement.classList.contains("light"));
  }, []);

  function alternar() {
    const next = !claro;
    setClaro(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "light" : "dark");
    } catch {
      // localStorage puede no estar disponible (modo privado); el toggle sigue funcionando en la sesión.
    }
  }

  return (
    <button
      className="iconbtn theme-btn"
      onClick={alternar}
      title={claro ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
    >
      {claro ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
