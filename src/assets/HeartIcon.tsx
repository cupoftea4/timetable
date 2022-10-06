import styles from './HeartIcon.module.scss';

const HeartIcon = ({liked}: {liked: boolean}) => {
  return (
      <svg className={`${styles.heart} ${liked && styles.liked} `} fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M24.3996 9.32811L22.392 7.36278C17.6797 2.74946 9.03888 4.34146 5.91969 10.1414C4.4553 12.8694 4.1249 16.8081 6.79889 21.8347C9.37488 26.6747 14.7341 32.472 24.3996 38.7867C34.0652 32.472 39.4216 26.6747 42.0004 21.8347C44.6744 16.8054 44.3468 12.8694 42.8796 10.1414C39.7604 4.34146 31.1196 2.74679 26.4072 7.36011L24.3996 9.32811Z"  stroke="white" strokeWidth="5"/>
      </svg>      

  )
}

export default HeartIcon