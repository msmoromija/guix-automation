export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`text-[1.65rem] font-bold leading-none tracking-[-0.04em] text-ink ${className}`}>
      Gui<span className="text-accent">X</span>
    </span>
  );
}
