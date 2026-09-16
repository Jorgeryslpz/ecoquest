export type Liga = "Bronce" | "Plata" | "Oro" | "Diamante";

const LIGAS: { nombre: Liga; min: number; max: number }[] = [
  { nombre: "Bronce", min: 0, max: 99 },
  { nombre: "Plata", min: 100, max: 249 },
  { nombre: "Oro", min: 250, max: 499 },
  { nombre: "Diamante", min: 500, max: Infinity },
];

export function ligaDeTrofeos(trofeos: number): Liga {
  return LIGAS.find((l) => trofeos >= l.min && trofeos <= l.max)?.nombre ?? "Bronce";
}

export const BOTS_ARRANQUE_FRIO = [
  "Fer_23",
  "Maru.exe",
  "ElChamo",
  "Nayelii",
  "Tono_MX",
  "Karla.dev",
  "Bryan_99",
  "Ximena22",
];
