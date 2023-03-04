import { FC, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useOnClickOutside from '../hooks/useOnOutsideClick';
import TimetableManager from '../utils/TimetableManager';
import TimetableUtil from '../utils/TimetableUtil';
import styles from './CreateMergedModal.module.scss';
import * as handler from '../utils/requestHandler';
import useFocus from '../hooks/useFocus';
import VirtualizedDataList from './VirtualizedDataList';

const getSearchBarOptions = () => {
  return TimetableUtil.getAllTimetables().map(group => ({id: group, value: group}));
}

function getSavedTimetables(){
  return TimetableManager.getCachedTimetables()
    .filter(group => !TimetableUtil.isMerged(group.group))
    .map(timetable => timetable.group);
}

type OwnProps = {
  defaultTimetable?: string;
  onClose: () => void;
};

const CreateMergedModal : FC<OwnProps> = ({defaultTimetable, onClose}) => {
  const [timetablesToMerge, setTimetablesToMerge] = useState<string[]>(
    defaultTimetable && !TimetableUtil.isMerged(defaultTimetable) ? [defaultTimetable] : []
  );

  const options = useMemo(() => {
    const savedTimetables = getSavedTimetables();
    const timetables = getSearchBarOptions()
      .filter(({value}) => 
        !timetablesToMerge.includes(value) && 
        !savedTimetables.includes(value) 
      );
    timetables.unshift(...savedTimetables.map(group => ({id: group, value: group})));
    return timetables;
  }, [timetablesToMerge]);

  const ref = useOnClickOutside<HTMLDivElement>(onClose);
  const [datalistRef, setInputFocus] = useFocus<HTMLDivElement>();
  const navigate = useNavigate();


  function addTimetableToMerge(timetable: string) {
    if (timetablesToMerge.includes(timetable)) return;
    setTimetablesToMerge([...timetablesToMerge, timetable]);
  }

  async function resolveTimetables() {
    const promises =  timetablesToMerge.map(timetable => TimetableManager.getTimetable(timetable));
    const optimisticPromises = promises.map(tuple => tuple[0]);
    const resolvedPromises = await Promise.all(optimisticPromises);
    if (resolvedPromises.some(promise => promise === undefined || promise instanceof Error)) {
      throw new Error("Failed to resolve timetable");
    }
    return resolvedPromises;
  }

  function onCreateClick() {
    if (timetablesToMerge.length < 2 || timetablesToMerge.length > 4) {
      handler.warn("Виберіть від 2 до 4 груп");
      return;
    }
    resolveTimetables()
      .then(timetables => {
        const mergedTimetable = TimetableUtil.mergeTimetables(timetables);
        TimetableManager.saveMergedTimetable(mergedTimetable, timetablesToMerge);
        onClose();
        navigate("/my");
      })
      .catch(console.error);
  }

  function onRemoveItem(timetable: string) {  
    setTimetablesToMerge([...timetablesToMerge.filter(t => t !== timetable)]);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.modal} ref={ref}>
        <div className={styles.header}>
          <h2 className={styles.title}>Оберіть групи для злиття</h2>
        </div>
          <fieldset className={styles.fieldset} onClick={() => setInputFocus(true)}>
            <legend className={styles.legend}>Пошук</legend>
            <div className={styles.choice}>
              <span className={styles.selected}>
                {timetablesToMerge.map((timetable, index) => (
                  <span 
                    key={index} 
                    onClick={() => onRemoveItem(timetable)} 
                    className={styles.selectedItem} 
                    data-content={timetable}>
                  </span>
                ))}
              </span>
              <VirtualizedDataList
                autoFocus
                clearOnSelect
                containerRef={datalistRef}
                className={styles["search-bar"]}
                onSelect={item => {
                  addTimetableToMerge(item.value);
                }}
                options={options}
              />
            </div>
          </fieldset>
        <button className={styles.button} onClick={onCreateClick}>Створити</button>
      </div>
    </div>
  )
}

export default CreateMergedModal;