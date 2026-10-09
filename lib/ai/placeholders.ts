// SVG placeholders used when no image API is configured or image generation fails,
// so the branding tab is never empty during a demo.

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => `&#${char.charCodeAt(0)};`);
}

function brandInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

const FONT = "Inter, 'Segoe UI', Arial, sans-serif";

export function placeholderLogoSvg(name: string, colors: string[], variant: number) {
  const [primary, secondary = primary] = colors;
  const initials = escapeXml(brandInitials(name) || "?");

  if (variant === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${secondary}"/></linearGradient></defs>
  <rect width="512" height="512" fill="#ffffff"/>
  <rect x="96" y="96" width="320" height="320" rx="72" fill="url(#g)"/>
  <text x="256" y="256" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="150" font-weight="700" fill="#ffffff">${initials}</text>
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#ffffff"/>
  <circle cx="256" cy="256" r="160" fill="none" stroke="${primary}" stroke-width="18"/>
  <circle cx="256" cy="256" r="124" fill="${secondary}" opacity="0.18"/>
  <text x="256" y="256" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="130" font-weight="700" fill="${primary}">${initials}</text>
</svg>`;
}

export function placeholderBannerSvg(name: string, slogan: string | undefined, colors: string[]) {
  const [primary, secondary = primary] = colors;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 640" width="1536" height="640">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${secondary}"/></linearGradient></defs>
  <rect width="1536" height="640" fill="url(#g)"/>
  <circle cx="1300" cy="120" r="260" fill="#ffffff" opacity="0.08"/>
  <circle cx="1420" cy="560" r="200" fill="#ffffff" opacity="0.08"/>
  <text x="110" y="${slogan ? 300 : 340}" font-family="${FONT}" font-size="104" font-weight="700" fill="#ffffff">${escapeXml(name)}</text>
  ${slogan ? `<text x="114" y="390" font-family="${FONT}" font-size="44" fill="#ffffff" opacity="0.9">${escapeXml(slogan)}</text>` : ""}
</svg>`;
}

export function svgDataUri(svg: string) {
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}
