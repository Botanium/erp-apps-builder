import type { CSSProperties } from "react";

export type IconName =
  | "spark"
  | "arrow"
  | "plus"
  | "box"
  | "bag"
  | "check"
  | "clock"
  | "mic"
  | "close"
  | "chevron"
  | "leaf"
  | "history"
  | "settings"
  | "logout";
const paths: Record<IconName, React.ReactNode> = {
  spark: (
    <>
      <path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  box: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9M7 5.8l10 5.5" />
    </>
  ),
  bag: (
    <>
      <path d="M5 7h14l1 14H4L5 7ZM8 8V6a4 4 0 0 1 8 0v2" />
    </>
  ),
  check: (
    <>
      <path d="m5 12 4 4L19 6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2" width="6" height="13" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M6 18 18 6" />
    </>
  ),
  chevron: (
    <>
      <path d="m9 5 7 7-7 7" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 3C7 1 2 9 6 16s16 4 14-13ZM5 21 16 9" />
    </>
  ),
  history: (
    <>
      <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6M12 7v5l4 2" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="3" />
      <circle cx="16" cy="17" r="3" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4H4v16h5M10 12h11m-5-5 5 5-5 5" />
    </>
  ),
};
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}

export function ShopIllustration() {
  return (
    <svg
      className="shop-illustration"
      viewBox="0 0 300 220"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="152" cy="197" rx="119" ry="12" fill="#ddd8cd" opacity=".5" />
      <g transform="rotate(-12 90 130)">
        <rect x="40" y="69" width="90" height="119" rx="6" fill="#e6a69a" />
        <rect x="48" y="69" width="8" height="119" fill="#be766d" />
        <rect x="67" y="97" width="43" height="33" rx="3" fill="#fff2da" />
        <path d="M78 109h21m-17 8h13" stroke="#a0796b" strokeWidth="2" />
      </g>
      <g transform="rotate(13 204 104)">
        <rect x="174" y="31" width="13" height="123" rx="4" fill="#e9bd69" />
        <path d="m174 154 6.5 17 6.5-17" fill="#decba3" />
        <path d="m178.5 166 2 5 2-5" fill="#4a5045" />
        <rect x="174" y="31" width="13" height="13" rx="3" fill="#b8847c" />
      </g>
      <rect x="137" y="118" width="94" height="77" rx="11" fill="#809785" />
      <path d="M151 135h66M151 146h66" stroke="#5b7462" strokeWidth="2" />
      <path d="M153 194v-39c0-17 61-17 61 0v39" fill="#b2be9d" />
      <circle cx="148" cy="81" r="20" fill="#d5ae66" />
      <circle cx="146" cy="78" r="5" fill="#f5dfad" />
      <path
        d="m245 66 4 10 11 2-9 7 1 11-9-6-10 4 3-10-6-9 11 1 4-10Z"
        fill="#e8bd74"
      />
      <circle cx="72" cy="35" r="4" fill="#849783" />
      <path d="m115 29 4 9m-9-2 11-4" stroke="#b3b7a6" strokeWidth="2" />
    </svg>
  );
}
