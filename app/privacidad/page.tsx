import Link from "next/link";

export const metadata = {
  title: "Aviso de privacidad · Kaanki",
};

export default function PrivacidadPage() {
  return (
    <div className="eq">
      <div className="eq-app">
        <div className="screen">
          <Link href="/" className="iconbtn" style={{ marginBottom: 14 }}>
            ←
          </Link>
          <h1>Aviso de privacidad</h1>
          <p className="dim" style={{ marginTop: 10 }}>
            Estamos preparando el aviso de privacidad de Kaanki. Si tienes alguna duda mientras
            tanto, escríbenos a <a href="mailto:contacto@kaanki.com">contacto@kaanki.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
