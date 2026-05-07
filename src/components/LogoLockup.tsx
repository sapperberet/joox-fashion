import Image from "next/image";
import LogoMark from "./LogoMark";

type LogoLockupProps = {
  className?: string;
};

export default function LogoLockup({ className }: LogoLockupProps) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <LogoMark className="h-12 w-12 text-gold" />
      <Image
        src="/joox-fashion.png"
        alt="Joox Fashion"
        width={220}
        height={64}
        sizes="220px"
        className="h-9 w-auto object-contain"
        priority
      />
    </div>
  );
}
