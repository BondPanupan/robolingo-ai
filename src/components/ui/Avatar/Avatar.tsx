"use client";

import { useState } from "react";
import styles from "./Avatar.module.css";

interface AvatarProps {
  name: string;
  src: string | null;
  size?: number;
}

const HUES = [150, 200, 260, 320, 20, 45];

function hueFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) | 0;
  return HUES[Math.abs(h) % HUES.length];
}

export function Avatar({ name, src, size = 44 }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? "?";

  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: size * 0.42, "--hue": hueFor(name) } as React.CSSProperties}
      aria-hidden
    >
      {src && !broken ? (
        // LINE profile images come from several CDNs; a plain img avoids remotePatterns config.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={() => setBroken(true)} />
      ) : (
        initial
      )}
    </span>
  );
}
