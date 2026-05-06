import LogoMark from "./LogoMark";

type LogoLockupProps = {
  className?: string;
};

export default function LogoLockup({ className }: LogoLockupProps) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <LogoMark className="h-12 w-12 text-gold" />
      <div className="leading-none">
        <div className="font-display text-2xl tracking-[0.2em] text-gold">
          JOOX
        </div>
        <div className="text-[0.65rem] uppercase tracking-[0.6em] text-sand">
          Fashion
        </div>
      </div>
    </div>
  );
}
