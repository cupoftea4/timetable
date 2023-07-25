import { FC } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { TABLET_SCREEN_BREAKPOINT } from '@/utils/constants';
import MobileSelect from '@/shared/MobileSelect';
import styles from './Navigation.module.scss';
import type { TimetableType } from '@/types/timetable';
import { classes } from '@/styles/utils';

const navigationItems: {value: TimetableType, name: string}[] = [
  {value: "timetable", name: "Студент"},
  {value: "selective", name: "Вибіркові"},
  {value: "lecturer", name: "Викладач"}
];

type OwnProps = {
  timetableType: TimetableType;
};

const Navigation: FC<OwnProps> = ({timetableType}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < TABLET_SCREEN_BREAKPOINT;
  const navigate = useNavigate();

  const onMobileSelectChange = (type: string) => {
    navigate("/" + (type === "timetable" ? "" : type));
  };

  return (
    <nav className={styles['timetable-types']}>
        {
          !isMobile ? 
              navigationItems.map(type =>
                <Link 
                  state={{force: true}}
                  to={"/" + (type.value === "timetable" ? "" : type.value)}
                  key={type.value}
                  className={classes(styles['nav-link'], timetableType === type.value && styles.active)}
                >
                  {type.name}
                </Link>
              )
            : 
              <MobileSelect 
                items={navigationItems} 
                selectedState={[timetableType, onMobileSelectChange]}
              />
        }
    </nav>
  )
};

export default Navigation;