import line from '../../assets/figma/arrow-up-1.svg';
import chevron from '../../assets/figma/arrow-up-2.svg';

type ScrollTopButtonProps = {
  visible: boolean;
  onClick: () => void;
};

export default function ScrollTopButton({ visible, onClick }: ScrollTopButtonProps) {
  return (
    <button
      type="button"
      className={`scroll-top-fab ${visible ? 'scroll-top-fab-visible' : ''}`}
      aria-label="Remonter en haut"
      onClick={onClick}
    >
      <span className="scroll-top-fab-icon">
        <img className="scroll-top-fab-line" src={line} alt="" />
        <img className="scroll-top-fab-chevron" src={chevron} alt="" />
      </span>
    </button>
  );
}
