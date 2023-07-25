import React, { FC } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SavedMenu from './components/SavedMenu';
import TimetablePartials from './components/TimetablePartials';
import Toggle from '@/shared/Toggle';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { MOBILE_SCREEN_BREAKPOINT } from '@/utils/constants';
import { isMerged } from '@/utils/timetable';
import TimetableManager from '@/utils/data/TimetableManager';
import HomeIcon from '@/assets/HomeIcon';
import { classes } from '@/styles/utils';
import Toast from '@/utils/toasts';
import generalStyles from './HeaderPanel.module.scss';
import styles from './TimetableHeader.module.scss';
import type { HalfTerm } from '@/types/timetable';

type OwnProps = {
  loading: boolean;
  isLecturers: boolean;
  timetableType?: string;
  isExamsTimetable: boolean;
  partials: HalfTerm[];
  subgroupState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  weekState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  updatePartialTimetable: (partial: HalfTerm | 0) => void;
}


const TimetableHeader: FC<OwnProps> = ({ 
  timetableType, 
  isExamsTimetable, 
  isLecturers,
  partials, 
  subgroupState, 
  weekState,  
  loading,
  updatePartialTimetable
}) => {
  const [isSecondSubgroup, setIsSecondSubgroup] = subgroupState;
  const [isSecondWeek, setIsSecondWeek] = weekState;
  const navigate = useNavigate();
  const group = useParams().group?.trim() ?? "";
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_SCREEN_BREAKPOINT;

  const handleIsExamsTimetableChange = (isExams: boolean) => {
    const path = isMerged(group) && TimetableManager.cachedMergedTimetable
      ? TimetableManager.cachedMergedTimetable.timetableNames.find(t => {
          const type = TimetableManager.tryToGetType(t);
          return type === 'timetable' || type === 'lecturer';
        }) || group
      : group;
    navigate('/' + path + (isExams ? '/exams' : ''));
  };
  

  const changeIsSecondSubgroup = (isSecond: boolean) => {
    setIsSecondSubgroup(isSecond);
    TimetableManager.updateSubgroup(group, isSecond ? 2 : 1)
      ?.catch(e => Toast.error(e, Toast.UPDATE_SUBGROUP_ERROR));
  };

  return (
    <header className={classes(generalStyles.header, styles.header)}>
    <nav className={generalStyles['right-buttons']}> 
      <Link state={{force: true}} to="/" aria-label="Home"><HomeIcon /></Link>
      <SavedMenu timetableChanged={loading} />
      <h1 className={styles.title}>{timetableType === 'merged' ? "Мій розклад" : group}</h1>
      {
        timetableType !== 'selective' &&
          <button
            className={generalStyles.exams}
            title={isExamsTimetable ? "Переключити на розклад пар" : "Переключити на розклад екзаменів"} 
            onClick={() => handleIsExamsTimetableChange(!isExamsTimetable)}
          >
            {!isExamsTimetable ? "Екзамени" : "Пари"}
          </button>
      }
      {
        !isExamsTimetable && 
          <TimetablePartials partials={partials} handlePartialClick={updatePartialTimetable} />
      }
    </nav>
    <span className={styles.params}>
      {!isExamsTimetable &&
          <>
            {!isLecturers && 
              <Toggle 
                toggleState={[isSecondSubgroup, changeIsSecondSubgroup]} 
                states={isMobile ? ["I підг.", "II підг."] : ["I підгрупа", "II підгрупа"]} />}
            <Toggle 
              toggleState={[isSecondWeek, setIsSecondWeek]} 
              states={isMobile ? ["По чис.", "По знам."] : ['По чисельнику', 'По знаменнику']} />
          </>
      }
    </span>
  </header>
  )
}

export default TimetableHeader