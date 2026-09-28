import line from '../../assets/figma/arrow-up-right-1.svg';
import head from '../../assets/figma/arrow-up-right-2.svg';

export default function ArrowUpRight() {
  return (
    <span className="arrow-up-right">
      <img className="arrow-up-right-line" src={line} alt="" />
      <img className="arrow-up-right-head" src={head} alt="" />
    </span>
  );
}
