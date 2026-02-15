import { useState } from "react";
import { formatAddress, copyToClipboard } from "../lib/utils";
import { PUMP_BUY_URL } from "../lib/constants";

interface HeaderProps {
  tokenCA: string;
}

export default function Header({ tokenCA }: HeaderProps) {
  const [copied, setCopied] = useState(false);
  const hasCA = tokenCA !== "To be added";

  const handleCopy = async () => {
    if (!hasCA) return;
    const ok = await copyToClipboard(tokenCA);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-casino-border bg-casino-dark">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-gold">777</h1>
        <button
          onClick={handleCopy}
          className="text-sm bg-casino-card border border-casino-border px-3 py-1.5 rounded hover:border-gold-dim transition-colors cursor-pointer"
          title={hasCA ? tokenCA : ""}
        >
          CA: {hasCA ? formatAddress(tokenCA) : "To be added"}
          {copied && <span className="ml-2 text-win-green text-xs">Copied!</span>}
        </button>
      </div>

      <div className="flex items-center gap-3">
        {hasCA && (
          <a
            href={`${PUMP_BUY_URL}${tokenCA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold text-black font-semibold px-4 py-1.5 rounded text-sm hover:bg-gold-bright transition-colors"
          >
            Buy on Pump
          </a>
        )}
        <a
          href="https://x.com"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-casino-border px-4 py-1.5 rounded text-sm hover:border-gold-dim transition-colors"
        >
          X
        </a>
      </div>
    </header>
  );
}
