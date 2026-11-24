import React from "react";

interface AptitudeLogoProps {
  className?: string;
  size?: number;
}

export default function AptitudeLogo({ className = "w-10 h-10", size }: AptitudeLogoProps) {
  const dimensionProps = size ? { width: size, height: size } : {};

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      {...dimensionProps}
    >
      {/* Outer Obsidian Tile */}
      <rect width="40" height="40" rx="10" fill="#06090D" />
      <rect
        x="0.75"
        y="0.75"
        width="38.5"
        height="38.5"
        rx="9.25"
        stroke="#242C3D"
        strokeWidth="1.5"
      />

      {/* Subtle Depth Grid lines */}
      <line x1="20" y1="4" x2="20" y2="36" stroke="#161D2B" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="4" y1="20" x2="36" y2="20" stroke="#161D2B" strokeWidth="1" strokeDasharray="2 2" />

      {/* Precision Geometric 'A' Apex (Aptitude & Growth) */}
      <path
        d="M20 7.5L30.5 28.5H24.2L20 20L15.8 28.5H9.5L20 7.5Z"
        fill="url(#aptitude-glyph-grad)"
      />

      {/* Analytical Crossbar (Brand Terracotta) */}
      <path
        d="M13.5 22.5H26.5"
        stroke="#D46733"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Accuracy & Talent Spark (Brand Imperial Emerald) */}
      <circle cx="20" cy="15" r="2.2" fill="#1B7A53" />
      <circle cx="20" cy="15" r="1.1" fill="#34D399" />

      {/* Apex Precision Dot */}
      <circle cx="20" cy="7.5" r="1" fill="#D46733" />

      <defs>
        <linearGradient
          id="aptitude-glyph-grad"
          x1="20"
          y1="7.5"
          x2="20"
          y2="28.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E5E4E0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
