// Decorative mark; the adjacent wordmark carries the accessible brand name.
export default function Logo() {
  return (
    <img
      className="brand-logo"
      src="/images/govschemes-logo.png"
      width="50"
      height="50"
      alt=""
      aria-hidden="true"
    />
  );
}
