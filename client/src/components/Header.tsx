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
    <header
      className="flex items-center justify-between px-4 py-3"
      style={{
        background: "linear-gradient(180deg, #3a0000 0%, #8b0000 50%, #3a0000 100%)",
        borderBottom: "3px solid #daa520",
        boxShadow: "0 3px 0 rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-gold animate-marquee-glow tracking-wider">
          777
        </h1>
        <button
          onClick={handleCopy}
          className="text-[8px] bg-casino-dark border-2 border-gold-dim px-3 py-1.5 text-cream hover:border-gold transition-colors cursor-pointer"
          style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
          title={hasCA ? tokenCA : ""}
        >
          CA: {hasCA ? formatAddress(tokenCA) : "TBA"}
          {copied && <span className="ml-2 text-win-green">OK!</span>}
        </button>
      </div>

      <div className="flex items-center gap-2">
        {hasCA && (
          <a
            href={`${PUMP_BUY_URL}${tokenCA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold text-casino-dark font-bold px-4 py-1.5 text-[9px] hover:bg-gold-bright transition-colors uppercase"
            style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
          >
            BUY ON PUMP
          </a>
        )}
        <a
          href="https://x.com"
          target="_blank"
          rel="noopener noreferrer"
          className="border-2 border-gold-dim px-4 py-1.5 text-[9px] text-cream hover:border-gold transition-colors uppercase"
          style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
        >
          X
        </a>
      </div>
    </header>
  );
}
