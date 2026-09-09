import { cn } from "@/utils/cn";

/**
 * The SheSync+ crescent-and-plus mark — "Variation A / Full Color on
 * Dark" from the approved brand identity system (Figma node 88:19,
 * file sHObiUquwIa7pzuABZ7pi4). Exact vector path exported from
 * Figma, not hand-drawn. Gold stroke reads on both light and dark
 * surfaces, so this single variant covers both themes.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="SheSync+"
    >
      <path
        d="M60.0018 16.6671H73.336M66.6689 10V23.3342M69.9523 41.6233C69.6399 47.4108 67.6578 52.984 64.2455 57.669C60.8333 62.3541 56.137 65.9505 50.7245 68.0234C45.3119 70.0964 39.4147 70.5572 33.7459 69.3502C28.077 68.1431 22.8791 65.3199 18.7805 61.2218C14.6819 57.1236 11.8581 51.926 10.6505 46.2573C9.44284 40.5886 9.90304 34.6914 11.9754 29.2786C14.0479 23.8658 17.6437 19.1692 22.3285 15.7565C27.0132 12.3438 32.5861 10.361 38.3736 10.048C39.7237 9.97466 40.4304 11.5814 39.7137 12.7248C37.3165 16.5603 36.29 21.0949 36.8018 25.5888C37.3136 30.0827 39.3334 34.2705 42.5316 37.4687C45.7298 40.6669 49.9176 42.6867 54.4115 43.1984C58.9054 43.7102 63.44 42.6838 67.2755 40.2866C68.4222 39.5699 70.0257 40.2732 69.9523 41.6233Z"
        stroke="#E5C158"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
