import Image from "next/image";

/**
 * Storefront image wrapper. Sources come from validated section content
 * (https/allowed hosts or data URIs) or the Supabase public bucket.
 */
export function StorefrontImage(props: {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const bypassWorkerOptimizer = /^(?:https?:|data:)/.test(props.src);
  return (
    <Image
      {...props}
      alt={props.alt}
      sizes={props.sizes ?? "100vw"}
      unoptimized={bypassWorkerOptimizer}
      style={props.fill ? { objectFit: "cover" } : undefined}
    />
  );
}
