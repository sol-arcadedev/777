import { useState, useEffect } from "react";

export function useCountdown(durationSec: number) {
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    setRemaining(durationSec);
  }, [durationSec]);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1_000);
    return () => clearInterval(id);
  }, [remaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

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
