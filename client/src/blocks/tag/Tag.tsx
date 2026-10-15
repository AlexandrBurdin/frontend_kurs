import './tag.css';

interface Props {
  label: string;
  tone?: 'default' | 'accent' | 'herb';
}

export function Tag({ label, tone = 'default' }: Props) {
  return <span className={`tag tag--${tone}`}>{label}</span>;
}
