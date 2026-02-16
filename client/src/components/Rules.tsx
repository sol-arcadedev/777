import { useState } from "react";
import { copyToClipboard } from "../lib/utils";

interface RulesProps {
  requiredHoldings: string;
  minSolTransfer: number;
  verificationWalletAddress: string;
}

export default function Rules({ requiredHoldings, minSolTransfer, verificationWalletAddress }: RulesProps) {
  return (
    <div
      className="p-4"
      style={{
        background: "linear-gradient(180deg, rgba(10,10,10,0.92) 0%, rgba(17,17,17,0.92) 100%)",
        border: "3px solid #daa520",
        boxShadow: "3px 3px 0 rgba(0,0,0,0.5), 0 0 10px rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="-mx-4 -mt-4 mb-3 py-1.5 px-3 text-center"
        style={{
          background: "linear-gradient(180deg, #daa520, #8b7340)",
          borderBottom: "2px solid #6b5320",
        }}
      >
        <h2 className="text-[11px] uppercase tracking-wider" style={{ color: "#1a0f00" }}>
          HOW TO PLAY
        </h2>
      </div>
      <ol className="text-[10px] text-cream/70 space-y-2.5 list-none">
        <li>
          <span className="text-gold-dim mr-1">[1]</span>
          HOLD AT LEAST <span className="text-gold font-bold">{Number(requiredHoldings).toLocaleString()}</span> 777 TOKENS
        </li>
        <li>
          <span className="text-gold-dim mr-1">[2]</span>
          SEND <span className="text-gold font-bold">{minSolTransfer} SOL</span> TO VERIFICATION WALLET
          <VerificationAddress address={verificationWalletAddress} />
        </li>
        <li>
          <span className="text-gold-dim mr-1">[3]</span>
          SPIN THE REELS OR GET ADDED TO THE SPIN QUEUE
        </li>
      </ol>

      {/* About section */}
      <div
        className="-mx-4 mt-3 py-1.5 px-3 text-center"
        style={{
          background: "linear-gradient(180deg, #daa520, #8b7340)",
          borderTop: "2px solid #6b5320",
          borderBottom: "2px solid #6b5320",
        }}
      >
        <span className="text-[10px] uppercase tracking-wider" style={{ color: "#1a0f00" }}>
          ABOUT 777
        </span>
      </div>
      <div className="text-[9px] text-cream/70 -mx-4 px-4 pt-3 pb-2 space-y-2.5" style={{ background: "rgba(0,0,0,0.2)" }}>
        <p className="leading-relaxed">
          <span className="text-gold">777</span> DEPOSITS 30% OF THE CREATOR FEES TO A <span className="text-gold font-bold">REWARD WALLET</span>, GRADUALLY INCREASING THE JACKPOT. AS THE MARKET CAP GROWS, THE MAJORITY OF FEES WILL GO TOWARD REWARDS.
        </p>
        <p className="leading-relaxed">
          SOL TRANSFERRED TO SPIN THE REELS IS USED FOR <span className="text-gold font-bold">ADDING LIQUIDITY</span>, <span className="text-lose-red font-bold">BUYBACK + BURN</span>, AND PARTLY ADDED TO THE <span className="text-gold font-bold">CURRENT REWARD</span>.
        </p>
        <p className="leading-relaxed">
          THIS APPROACH LETS 777 SUSTAIN ITSELF AND IMMENSELY STRENGTHEN THE PRICE.
        </p>
      </div>
    </div>
  );
}

function VerificationAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(address);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div
      className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1.5"
      style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(218,165,32,0.3)",
      }}
    >
      <span className="text-[8px] text-gold-dim/70 break-all leading-relaxed">{address}</span>
      <button
        onClick={handleCopy}
        className="text-gold-dim/60 hover:text-gold transition-colors cursor-pointer"
        title="Copy address"
      >
        {copied ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}
