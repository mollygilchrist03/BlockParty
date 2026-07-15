import Image from "next/image";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const sizes = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

const pixelSizes = { sm: 24, md: 36, lg: 44 };

export function Avatar({
  name,
  imageUrl,
  size = "md",
  className = "",
}: {
  name: string;
  imageUrl?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        title={name}
        width={pixelSizes[size]}
        height={pixelSizes[size]}
        className={`shrink-0 rounded-full object-cover ring-2 ring-white ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <span
      title={name}
      className={`flex shrink-0 items-center justify-center rounded-full bg-sage-light font-semibold text-sage ring-2 ring-white ${sizes[size]} ${className}`}
    >
      {initials(name)}
    </span>
  );
}
