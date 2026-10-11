import React from 'react';

/**
 * GutsyLogo - Official GUTSY Isotipo component.
 * Rendered from transparent high-resolution vector source.
 * In Light mode: turns crisp black (`invert`).
 * In Dark mode: stays crisp white (`dark:invert-0`).
 */
export function GutsyLogo({ className = "w-8 h-8", forceWhite = false, ...props }) {
  return (
    <img
      src="/gutsy-logo.png"
      alt="GUTSY"
      className={`${className} object-contain select-none transition-opacity ${
        forceWhite ? 'invert-0' : 'invert dark:invert-0'
      }`}
      {...props}
    />
  );
}

export default GutsyLogo;
