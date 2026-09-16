export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="eq">
      <div className="eq-app">
        <div className="screen">{children}</div>
      </div>
    </div>
  );
}
