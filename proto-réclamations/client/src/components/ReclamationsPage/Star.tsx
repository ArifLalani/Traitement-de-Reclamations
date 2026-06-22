import starFilled from '../../assets/figma/star-filled.svg';
import starOutline from '../../assets/figma/star-outline.svg';

type StarProps = {
  filled: boolean;
};

export default function Star({ filled }: StarProps) {
  return (
    <img
      className="star"
      src={filled ? starFilled : starOutline}
      alt=""
      width={18}
      height={18}
    />
  );
}
