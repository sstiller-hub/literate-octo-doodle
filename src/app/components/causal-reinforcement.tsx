interface CausalReinforcementProps {
  message: string;
}

export function CausalReinforcement({ message }: CausalReinforcementProps) {
  return (
    <div className="px-1 py-1.5 border-t border-border/40">
      <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
        {message}
      </p>
    </div>
  );
}
