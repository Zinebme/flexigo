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
  return (
    <Image
      {...props}
      alt={props.alt}
      sizes={props.sizes ?? "100vw"}
      style={props.fill ? { objectFit: "cover" } : undefined}
    />
  );
}
