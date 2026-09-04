import { cn } from "@/utils/cn";

interface OrganicArtworkProps {
  /** "duo" = rose+sage (default, most common); "trio" adds a cream/amber accent. */
  variant?: "duo" | "trio";
  className?: string;
}

/**
 * The SheSync+ V1 signature visual motif: soft, translucent overlapping
 * organic shapes (blush rose + muted sage, occasionally warm cream). Pure
 * inline SVG — no raster assets, scales cleanly, respects reduced-motion
 * (it's static, nothing to reduce).
 */
export function OrganicArtwork({ variant = "duo", className }: OrganicArtworkProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={cn("h-auto w-full", className)}
      role="presentation"
      aria-hidden="true"
    >
      <ellipse
        cx="150"
        cy="130"
        rx="150"
        ry="110"
        fill="var(--accent-rose)"
        opacity="0.22"
      />
      <ellipse
        cx="250"
        cy="190"
        rx="140"
        ry="100"
        fill="var(--accent-sage)"
        opacity="0.22"
      />
      {variant === "trio" && (
        <ellipse
          cx="210"
          cy="110"
          rx="90"
          ry="65"
          fill="var(--accent-amber)"
          opacity="0.18"
        />
      )}
    </svg>
  );
}
