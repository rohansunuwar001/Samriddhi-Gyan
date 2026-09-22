import React, { useState } from "react";
import { Link } from "react-router-dom";

// ─── Newsletter API (mirrors FIND's subscribeNewsletter) ─────────────────────
async function subscribeNewsletter(email) {
  try {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
    const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch {
    return { success: true };
  }
}

// ─── CSS keyframe injected once ──────────────────────────────────────────────
const wordmarkKeyframes = `
  @keyframes letterFadeUp {
    from { opacity: 0; transform: translateY(40%); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ─── Wordmark (letter-by-letter animated, two rows) ──────────────────────────
function FooterWordmark() {
  const words = ['Samriddhi', 'Gyan'];

  // Count total letters before current word for correct stagger offset
  let globalIndex = 0;

  return (
    <div aria-label="Samriddhi Gyan">
      <style>{wordmarkKeyframes}</style>

      {words.map((word) => {
        const startIndex = globalIndex;
        globalIndex += word.length;

        return (
          <div
            key={word}
            style={{
              display: 'flex',
              gap: '5rem',
              flexWrap: 'nowrap',
            }}
          >
            {word.split('').map((char, i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{
                  color: '#fff',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  fontSize: '10vw',
                  userSelect: 'none',
                  display: 'inline-block',
                  animation: 'letterFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
                  animationDelay: `${(startIndex + i) * 0.05}s`,
                }}
              >
                {char}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Arrow icon (matches FIND's filled ArrowIcon exactly) ────────────────────
function ArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      style={{ width: "2rem", height: "2rem" }}
    >
      <path
        fill="currentColor"
        d="m20.78 12.531-6.75 6.75a.75.75 0 1 1-1.06-1.061l5.47-5.47H3.75a.75.75 0 1 1 0-1.5h14.69l-5.47-5.469a.75.75 0 1 1 1.06-1.061l6.75 6.75a.75.75 0 0 1 0 1.061"
      />
    </svg>
  );
}

// ─── Main Footer ─────────────────────────────────────────────────────────────
export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await subscribeNewsletter(email);
    setLoading(false);
    setSubscribed(true);
  };

  const navLinks = [
    { label: "Courses", href: "/courses" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact", external: false },
  ];

  const socialLinks = [
    { label: "Facebook", href: "https://facebook.com/samriddhigyan" },
    { label: "Instagram", href: "https://instagram.com/samriddhigyan" },
    { label: "Youtube", href: "https://youtube.com/@samriddhigyan" },
    { label: "Linkedin", href: "https://linkedin.com/company/samriddhigyan" },
  ];

  const legalLinks = [
    { label: "Terms of Use", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Cookie Policy", href: "/cookie-policy" },
  ];

  return (
    /*
      Mirrors FIND's footer exactly:
      — backgroundColor: #0a0a0c  (near-black, same as FIND)
      — minHeight: 100svh          (fills full viewport)
      — flexDirection: column      (flex spacer pushes wordmark to bottom)
    */
    <footer
      data-purpose="footer"
      style={{
        backgroundColor: "#0a0a0c",
        color: "#fff",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ══ TOP: Newsletter + Contact (left) · Nav (center) · Social (right) ══ */}
      <div
        style={{
          padding:
            "clamp(4rem, 6vw, 8rem) clamp(2.5rem, 6vw, 8rem) clamp(2rem, 4vw, 4rem)",
          maxWidth: "172rem",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: "4rem 8rem",
            alignItems: "start",
          }}
        >
          {/* Newsletter + Contact */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "4rem" }}
          >
            {/* Heading */}
            <h3
              style={{
                fontWeight: 700,
                fontSize: "clamp(1.4rem, 2vw, 1.8rem)",
                color: "#fff",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Get Updates on Samriddhi Gyan
            </h3>

            {/* Email input / success state */}
            {subscribed ? (
              <p style={{ fontSize: "1.4rem", color: "#34d399" }}>
                ✓ You are now subscribed to Samriddhi Gyan updates.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.25)",
                    paddingBottom: "1.2rem",
                    gap: "1rem",
                  }}
                >
                  <input
                    type="email"
                    required
                    placeholder="Enter address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#fff",
                      fontSize: "1.4rem",
                      fontWeight: 500,
                      caretColor: "#fff",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      opacity: loading ? 0.5 : 1,
                    }}
                    aria-label="Subscribe"
                  >
                    <ArrowIcon />
                  </button>
                </div>
              </form>
            )}

            {/* Contact 3-col grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "3rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "1.1rem",
                    color: "#666",
                    marginBottom: "1rem",
                    fontWeight: 500,
                  }}
                >
                  Head Office
                </p>
                <a
                  href="https://www.google.com/maps/search/Samriddhi+Gyan+Kathmandu+Nepal"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "1.4rem",
                    color: "#fff",
                    lineHeight: 1.6,
                    display: "block",
                    textDecoration: "none",
                  }}
                >
                  Kathmandu, Bagmati Province,
                  <br />
                  Nepal
                </a>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "1.1rem",
                    color: "#666",
                    marginBottom: "1rem",
                    fontWeight: 500,
                  }}
                >
                  Email Us
                </p>
                <a
                  href="mailto:email@samriddhigyan.com"
                  style={{
                    fontSize: "1.4rem",
                    color: "#fff",
                    display: "block",
                    textDecoration: "none",
                  }}
                >
                  email@samriddhigyan.com
                </a>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "1.1rem",
                    color: "#666",
                    marginBottom: "1rem",
                    fontWeight: 500,
                  }}
                >
                  Call Us
                </p>
                <a
                  href="tel:+977XXXXXXXXXX"
                  style={{
                    fontSize: "1.4rem",
                    color: "#fff",
                    display: "block",
                    textDecoration: "none",
                  }}
                >
                  +977-XXXXXXXXXX
                </a>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.2rem",
              paddingTop: "0.4rem",
            }}
          >
            {navLinks.map(({ label, href, external }) =>
              external ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "1.6rem",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 400,
                  }}
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  to={href}
                  style={{
                    fontSize: "1.6rem",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 400,
                  }}
                >
                  {label}
                </Link>
              ),
            )}
          </nav>

          {/* Social links */}
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.2rem",
              paddingTop: "0.4rem",
            }}
          >
            {socialLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "1.4rem",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 400,
                }}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* ══ GIANT WORDMARK ══ */}
      <div
        style={{
          padding: "0 clamp(2rem, 4vw, 6rem)",
          paddingBottom: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ width: "100%", maxWidth: "1514px", margin: "0 auto" }}>
          <FooterWordmark />
        </div>
      </div>

      {/* ══ Legal strip ══ */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          marginTop: "1rem",
        }}
      >
        <div
          style={{
            maxWidth: "172rem",
            margin: "0 auto",
            padding: "2rem clamp(2.5rem, 6vw, 8rem)",
            display: "flex",
            flexWrap: "wrap",
            gap: "1.2rem 2rem",
            alignItems: "center",
          }}
        >
          {legalLinks.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              style={{
                fontSize: "1.1rem",
                color: "#555",
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}

          <div className="both-row">
            <span
              style={{ marginLeft: "auto", fontSize: "1.1rem", color: "#555" }}
            >
              Samriddhi Gyan Pvt. Ltd.
            </span>
            <span style={{ fontSize: "1.1rem", color: "#555" }}>
              Copyright © {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
