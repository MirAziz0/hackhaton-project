import "server-only";
import { randomUUID } from "node:crypto";
import { generateImage } from "@/lib/ai/image";
import { placeholderBannerSvg, placeholderLogoSvg, svgDataUri } from "@/lib/ai/placeholders";
import { bannerPrompt, logoPrompt } from "@/lib/ai/prompts";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BrandingImages } from "@/types/studio";

const BUCKET = "branding";
const LOGO_COUNT = 2;
const DEFAULT_COLORS = ["#4338CA", "#F59E0B"];

export interface BrandingInput {
  userId: string;
  name: string;
  slogan?: string;
  product?: string;
  visualStyle?: { style: string; colors: string[]; logo_concept: string };
}

async function upload(userId: string, data: Buffer, contentType: string, extension: string) {
  const supabase = createAdminClient();
  const path = `${userId}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, data, { contentType });
  if (error) {
    console.error("[branding] storage upload failed:", error.message);
    return null;
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Stores an SVG placeholder; if storage is unavailable, inlines it as a data URI instead.
async function storePlaceholder(userId: string, svg: string) {
  return (await upload(userId, Buffer.from(svg, "utf8"), "image/svg+xml", "svg")) ?? svgDataUri(svg);
}

// Branding agent: builds image prompts from the plan, generates the logos and the banner
// in parallel and stores them in Supabase Storage. Any image that fails becomes a placeholder.
export async function generateBrandingImages(input: BrandingInput): Promise<BrandingImages> {
  // Colours end up inside SVG markup, so accept strict hex values only.
  const hexColors = (input.visualStyle?.colors ?? []).filter((color) => /^#[0-9a-f]{6}$/i.test(color));
  const colors = hexColors.length ? hexColors : DEFAULT_COLORS;
  const promptInput = {
    name: input.name,
    slogan: input.slogan,
    product: input.product,
    style: input.visualStyle?.style,
    colors,
    logoConcept: input.visualStyle?.logo_concept,
  };

  let placeholder = false;

  async function produce(prompt: string, shape: "square" | "wide", fallbackSvg: string) {
    const image = await generateImage(prompt, shape);
    const extension = image?.contentType === "image/jpeg" ? "jpg" : image?.contentType === "image/webp" ? "webp" : "png";
    const url = image ? await upload(input.userId, image.data, image.contentType, extension) : null;
    if (url) return url;
    placeholder = true;
    return storePlaceholder(input.userId, fallbackSvg);
  }

  const [banner_url, ...logo_urls] = await Promise.all([
    produce(bannerPrompt(promptInput), "wide", placeholderBannerSvg(input.name, input.slogan, colors)),
    ...Array.from({ length: LOGO_COUNT }, (_, variant) =>
      produce(logoPrompt(promptInput, variant), "square", placeholderLogoSvg(input.name, colors, variant)),
    ),
  ]);

  return { logo_urls, banner_url, placeholder };
}
