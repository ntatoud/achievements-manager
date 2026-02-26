import { useEffect, useState } from "react";

export function JumpscarePage({ tamperKey }: { tamperKey: string }) {
  const [visible, setVisible] = useState(false);

  // Slight delay so the transition feels like a system alarm kicking in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060008] overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease-in",
      }}
    >
      {/* Animated scanlines */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,60,0.03) 2px, rgba(255,0,60,0.03) 4px)",
        }}
      />

      {/* Red grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,0,60,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,60,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Pulsing red vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(180,0,30,0.35) 100%)",
          animation: "pulse-vignette 1.2s ease-in-out infinite",
        }}
      />

      <style>{`
        @keyframes pulse-vignette {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes glitch-h {
          0%   { clip-path: inset(40% 0 55% 0); transform: translate(-4px, 0); }
          20%  { clip-path: inset(10% 0 75% 0); transform: translate(4px, 0); }
          40%  { clip-path: inset(70% 0 10% 0); transform: translate(-2px, 0); }
          60%  { clip-path: inset(30% 0 50% 0); transform: translate(3px, 0); }
          80%  { clip-path: inset(80% 0 5%  0); transform: translate(-3px, 0); }
          100% { clip-path: inset(40% 0 55% 0); transform: translate(0, 0); }
        }
        .glitch-title {
          position: relative;
        }
        .glitch-title::before,
        .glitch-title::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          animation: glitch-h 2.4s infinite linear;
        }
        .glitch-title::before {
          color: #ff003c;
          opacity: 0.7;
          animation-delay: 0s;
        }
        .glitch-title::after {
          color: #ff6090;
          opacity: 0.5;
          animation-delay: -1.2s;
        }
      `}</style>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-8 text-center max-w-2xl">
        {/* Warning icon */}
        <div
          className="text-7xl select-none"
          style={{ filter: "drop-shadow(0 0 24px #ff003c)" }}
        >
          ☠
        </div>

        {/* Title */}
        <h1
          className="glitch-title font-mono text-4xl font-bold uppercase tracking-widest"
          data-text="INTEGRITY BREACH"
          style={{ color: "#ff003c", textShadow: "0 0 20px #ff003c, 0 0 40px #ff003c80" }}
        >
          INTEGRITY BREACH
        </h1>

        {/* Divider */}
        <div className="w-full h-px" style={{ background: "linear-gradient(90deg, transparent, #ff003c, transparent)" }} />

        {/* Details */}
        <div className="flex flex-col gap-3 font-mono text-sm" style={{ color: "#ff6080" }}>
          <p className="text-base" style={{ color: "#ffb0c0" }}>
            Tampered storage detected. The system has flagged your session.
          </p>
          <p>
            Compromised key:{" "}
            <span
              className="px-2 py-0.5 rounded text-xs"
              style={{ background: "#ff003c22", color: "#ff4060", border: "1px solid #ff003c44" }}
            >
              {tamperKey}
            </span>
          </p>
          <p style={{ color: "#884050" }}>
            All achievement data has been invalidated.
          </p>
        </div>

        {/* Acknowledge button */}
        <button
          className="mt-4 px-8 py-3 font-mono text-sm uppercase tracking-widest rounded cursor-pointer transition-all duration-150"
          style={{
            background: "#ff003c18",
            border: "1px solid #ff003c",
            color: "#ff6080",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#ff003c33";
            (e.currentTarget as HTMLButtonElement).style.color = "#ffb0c0";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#ff003c18";
            (e.currentTarget as HTMLButtonElement).style.color = "#ff6080";
          }}
          onClick={() => window.location.reload()}
        >
          [ I was cheating. Reload. ]
        </button>
      </div>
    </div>
  );
}
