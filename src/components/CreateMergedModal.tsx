import { FC, useMemo, useState } from 'react';
import DatalistInput from 'react-datalist-input';
import { useNavigate } from 'react-router-dom';
import useOnClickOutside from '../hooks/useOnOutsideClick';
import TimetableManager from '../utils/TimetableManager';
import TimetableUtil from '../utils/TimetableUtil';
import styles from './CreateMergedModal.module.scss';
import * as handler from '../utils/requestHandler';
import useFocus from '../hooks/useFocus';

const getSearchBarOptions = () => {
  return TimetableUtil.getAllTimetables().map(group => ({id: group, value: group}));
}

type OwnProps = {
  defaultTimetable?: string;
  onClose: () => void;
};

const CreateMergedModal : FC<OwnProps> = ({defaultTimetable, onClose}) => {
  const [timetablesToMerge, setTimetablesToMerge] = useState<string[]>(defaultTimetable ? [defaultTimetable] : []);
  const [displayedCount, setDisplayedCount] = useState(10);
  const [inputValue, setInputValue] = useState('');
  const options = useMemo(
    () => getSearchBarOptions().filter(({value}) => 
      !timetablesToMerge.includes(value) && value.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())), 
  [timetablesToMerge, inputValue]);
  const displayedOptions = options.slice(0, displayedCount);

  const showMoreOptions = () => {
    setDisplayedCount(displayedCount + 10);
  }

  const ref = useOnClickOutside<HTMLDivElement>(onClose);
  const [inputRef, setInputFocus] = useFocus<HTMLInputElement>();
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
        TimetableManager.saveCustomTimetable(mergedTimetable);
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
              <DatalistInput
                inputProps={{
                  autoFocus: true,
                  onChange: (e) => {setInputValue(e.currentTarget.value);},
                }}
                listboxProps={{
                  onScroll: (e) => {
                    const bottom = e.currentTarget.scrollHeight - e.currentTarget.clientHeight;
                    if (Math.abs(e.currentTarget.scrollTop - bottom) < 2) {
                      showMoreOptions();
                    }
                  }
                }}
                ref={inputRef}
                className={styles["search-bar"]}
                placeholder={""}
                label=""
                onSelect={item => addTimetableToMerge(item.value)}
                items={displayedOptions}
              />
            </div>
          </fieldset>
        <button className={styles.button} onClick={onCreateClick}>Створити</button>
      </div>
    </div>
  )
}

export default CreateMergedModal