import Image from "next/image";

type LogoMarkProps = {
  className?: string;
};

export default function LogoMark({ className }: LogoMarkProps) {
  return (
    <div className={className} aria-hidden="true">
      <Image
        src="/joox-icon.png"
        alt=""
        width={120}
        height={120}
        sizes="120px"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
