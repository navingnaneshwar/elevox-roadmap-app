/**
 * ElevOX brand wordmark — pure HTML/CSS, no image background issues.
 * Works on dark and light backgrounds.
 *
 * Props:
 *  size   — "sm" | "md" | "lg" (default "md")
 *  theme  — "dark" | "light"   (default "dark") — controls "Elev" color
 */
export default function Logo({ size = "md", theme = "dark" }) {
  const sizes = {
    sm: { wordmark: "15px", tagline: "8px",  letterSpacing: "0.5px" },
    md: { wordmark: "20px", tagline: "9px",  letterSpacing: "0.5px" },
    lg: { wordmark: "32px", tagline: "11px", letterSpacing: "1px"   },
  };

  const s = sizes[size] || sizes.md;
  const elevColor = theme === "dark" ? "#F1F5F9" : "#1B2D5B";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1 }}>
      {/* Wordmark row */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
        <span style={{
          fontSize: s.wordmark,
          fontWeight: "700",
          fontFamily: "'Outfit', 'Georgia', serif",
          color: elevColor,
          letterSpacing: s.letterSpacing,
          lineHeight: 1,
        }}>
          Elev
        </span>
        <span style={{
          fontSize: s.wordmark,
          fontWeight: "700",
          fontFamily: "'Outfit', 'Georgia', serif",
          color: "#C8A96E",
          letterSpacing: s.letterSpacing,
          lineHeight: 1,
        }}>
          OX
        </span>
      </div>
      {/* Tagline */}
      {size !== "sm" && (
        <div style={{
          fontSize: s.tagline,
          color: theme === "dark" ? "#334155" : "#64748B",
          fontFamily: "'Inter', sans-serif",
          letterSpacing: "1.5px",
          marginTop: "3px",
          textTransform: "uppercase",
          fontWeight: "400",
        }}>
          Turning Leadership into Digital Influence
        </div>
      )}
    </div>
  );
}
