import { getSentiment } from './data';

export default function SentimentIcon({ text }: { text: string }) {
  const sentiment = getSentiment(text);

  if (sentiment === 'negative') {
    return (
      <svg viewBox="0 0 32 32" width={28} height={28} fill="none" stroke="#d32f2f" strokeWidth="1.6">
        <circle cx="16" cy="16" r="13" />
        <circle cx="11.5" cy="13" r="1.4" fill="#d32f2f" stroke="none" />
        <circle cx="20.5" cy="13" r="1.4" fill="#d32f2f" stroke="none" />
        <path d="M11 21c1-2 3-3 5-3s4 1 5 3" strokeLinecap="round" />
      </svg>
    );
  }
  if (sentiment === 'positive') {
    return (
      <svg viewBox="0 0 32 32" width={28} height={28} fill="none" stroke="#1b5e20" strokeWidth="1.6">
        <circle cx="16" cy="16" r="13" />
        <circle cx="11.5" cy="13" r="1.4" fill="#1b5e20" stroke="none" />
        <circle cx="20.5" cy="13" r="1.4" fill="#1b5e20" stroke="none" />
        <path d="M11 19.5c1 2 3 3 5 3s4-1 5-3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" width={28} height={28} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="1.6">
      <circle cx="16" cy="16" r="13" />
      <circle cx="11.5" cy="13" r="1.4" fill="rgba(0,0,0,0.6)" stroke="none" />
      <circle cx="20.5" cy="13" r="1.4" fill="rgba(0,0,0,0.6)" stroke="none" />
      <path d="M11 20.5h10" strokeLinecap="round" />
    </svg>
  );
}
