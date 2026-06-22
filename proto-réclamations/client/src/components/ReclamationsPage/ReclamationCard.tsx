import expandMore from '../../assets/figma/expand-more.svg';
import ArrowUpRight from './ArrowUpRight';
import SourceIcon from './SourceIcon';
import Star from './Star';
import type { Reclamation } from './data';

const STATE_LABEL: Record<Reclamation['state'], string> = {
  possible: 'Possible réclamation',
  'a-traiter': 'À traiter',
  declinee: 'Déclinée',
};

function toHref(url: string) {
  const cleaned = url.replace(/\.{3}$/, '');
  return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
}

type ReclamationCardProps = {
  reclamation: Reclamation;
};

export default function ReclamationCard({ reclamation }: ReclamationCardProps) {
  const { state, isNew, source, date, url, author, rating, text } = reclamation;
  const isDeclinee = state === 'declinee';

  return (
    <div className="card">
      <div className="card-top">
        <div className="card-top-row">
          <div className="card-source">
            <SourceIcon source={source} />
            <span className="card-source-name">{source}</span>
            <span className="card-dot">·</span>
            <span className="card-date">{date}</span>
          </div>
          <div className="card-chips">
            <span className={`chip chip-${state}`}>{STATE_LABEL[state]}</span>
            {isNew && <span className="chip chip-new">Nouveau</span>}
          </div>
        </div>
        <a
          className="card-url-row"
          href={toHref(url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="card-url">{url}</span>
          <ArrowUpRight />
        </a>
      </div>

      <div className="card-body">
        <div className="card-author-row">
          <span className="card-author">{author}</span>
          {rating !== null && (
            <div className="card-stars">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} filled={i < rating} />
              ))}
            </div>
          )}
        </div>
        <p className="card-text">{text}</p>
        <button type="button" className="btn-link">
          Voir plus
          <img src={expandMore} alt="" width={12} height={7.4} />
        </button>
      </div>

      <div className="card-actions">
        <button type="button" className="btn-text">
          {isDeclinee ? 'Créer une réclamation' : 'Ignorer'}
        </button>
        {!isDeclinee && (
          <button type="button" className="btn-outlined">
            Créer une réclamation
          </button>
        )}
      </div>
    </div>
  );
}
