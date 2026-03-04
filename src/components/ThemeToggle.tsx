"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggle() {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={isLight ? "Passer en thème sombre" : "Passer en thème clair"}
      className="w-8 h-8 flex items-center justify-center rounded-md border border-muted text-muted font-mono text-xl hover:border-accent hover:text-accent transition-colors"
    >
      {isLight ? "☽" : "☀"}
    </button>
  );
}
