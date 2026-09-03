import Image from "next/image";

export default function BrandLogo({ size = 42, className = "" }) {
  return (
    <Image
      src="/assets/lifelink-logo.png"
      alt="LifeLink"
      width={size}
      height={size}
      priority
      className={`rounded-xl object-contain ${className}`}
    />
  );
}
