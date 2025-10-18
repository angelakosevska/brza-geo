// src/components/global/Footer.jsx
import GlassCard from "./GlassCard";

export default function Footer() {
  return (
    <GlassCard className="flex flex-row justify-between items-center mb-1 mx-auto p-4 w-full text-[var(--text)]/80 text-xs">
      <span>© {new Date().getFullYear()} TypeRush</span>
      <span className="flex gap-3">
        <a
          href="/invitation"
          className="hover:text-[var(--accent)] transition-colors"
        >
          Покана
        </a>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--accent)] transition-colors"
        >
          GitHub
        </a>
      </span>
    </GlassCard>
  );
}
