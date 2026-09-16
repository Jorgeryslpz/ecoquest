import MateriaClient from "./MateriaClient";

export default async function MateriaPage({
  params,
}: {
  params: Promise<{ materia: string }>;
}) {
  const { materia } = await params;
  return <MateriaClient materia={decodeURIComponent(materia)} />;
}
