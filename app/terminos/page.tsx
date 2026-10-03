import Link from "next/link";

export const metadata = {
  title: "Términos y condiciones · Kaanki",
};

export default function TerminosPage() {
  return (
    <div className="eq">
      <div className="eq-app">
        <div className="screen">
          <Link href="/" className="iconbtn" style={{ marginBottom: 14 }}>
            ←
          </Link>
          <h1>Términos y condiciones</h1>
          <p className="dim" style={{ marginTop: 10 }}>
            Estamos preparando el aviso de términos y condiciones de Kaanki. Si tienes alguna
            duda mientras tanto, escríbenos a{" "}
            <a href="mailto:contacto@kaanki.com">contacto@kaanki.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
