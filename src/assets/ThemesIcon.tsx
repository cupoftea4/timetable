import { classes } from '@/styles/utils';
import styles from './ThemesIcon.module.scss';

/* eslint-disable max-len */
const ThemesIcon = () => {
  return (
    <svg
      className={classes('stroke-based', styles.icon)}
      width="150px"
      height="150px"
      viewBox="0 0 192 192"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="white"
    >
      <g id="SVGRepo_iconCarrier">
        <g clipPath="url(#a)">
          <path
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="15"
            d="M96 22v30m24-30v36m-42 76v24a11.998 11.998 0 0 0 12 12h12c3.183 0 6.235-1.264 8.485-3.515A11.996 11.996 0 0 0 114 158v-24M48 96v20a11.998 11.998 0 0 0 12 12h72c3.183 0 6.235-1.264 8.485-3.515A11.996 11.996 0 0 0 144 116V96.149L48 96Zm0 0V46a24 24 0 0 1 24-24h72v74H48Z"
          ></path>
        </g>
        <defs>
          <clipPath id="a">
            <path fill="white" d="M0 0h192v192H0z"></path>
          </clipPath>
        </defs>
      </g>
    </svg>
  );
};

export default ThemesIcon;
