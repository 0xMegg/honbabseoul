import { Logo } from "./Logo";

type HeaderProps = {
  description: string;
  eyebrow: string;
  title: string;
};

export function Header({ description, eyebrow, title }: HeaderProps) {
  return (
    <header className="space-y-3">
      <Logo className="h-12 w-auto" tone="brand" />
      <div className="space-y-2">
        <p className="text-sm font-semibold text-brand">{eyebrow}</p>
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        <p className="max-w-xl text-sm leading-6 text-text-muted">{description}</p>
      </div>
    </header>
  );
}
