import { MouseEventHandler } from 'react';
import styles from './HeartIcon.module.scss';

const HeartIcon = ({liked, onClick}: {liked?: boolean, onClick?: MouseEventHandler<SVGSVGElement>}) => {
  return (
      <svg onClick={onClick} className={`${styles.heart} ${liked && styles.liked} ` } viewBox="0 0 42 38" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.0003 8.21602L19.2974 6.54894C15.3002 2.63572 7.97068 3.98612 5.32485 8.90592C4.08269 11.2199 3.80243 14.5609 6.07062 18.8247C8.25569 22.9302 12.8016 27.8477 21.0003 33.204C29.1991 27.8477 33.7426 22.9302 35.93 18.8247C38.1982 14.5586 37.9203 11.2199 36.6758 8.90592C34.03 3.98612 26.7005 2.63346 22.7033 6.54668L21.0003 8.21602Z" fill="white" stroke="white" strokeWidth="5"/>
      </svg>
  )
};

export default HeartIcon;