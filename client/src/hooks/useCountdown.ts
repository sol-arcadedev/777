import { useState, useEffect } from "react";

export function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(0);
      return;
    }

    function calcRemaining() {
      return Math.max(
        0,
        Math.floor((new Date(expiresAt!).getTime() - Date.now()) / 1000),
      );
    }

    setRemaining(calcRemaining());

    const id = setInterval(() => {
      setRemaining(calcRemaining());
    }, 1_000);

    return () => clearInterval(id);
  }, [expiresAt]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const display = [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");

  return { remaining, display };
}
