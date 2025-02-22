import LinkIcon from "@/shared/LinkIcon";
import type { TimetableItemType } from "@/types/timetable";
import { type FC, useState } from "react";
import { classes } from "../../../styles/utils";
import styles from "./TimetableLink.module.scss";

type OwnProps = {
  urls: string[];
  type: TimetableItemType;
};

const TimetableLink: FC<OwnProps> = ({ urls, type }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const openDropdown = () => {
    setShowDropdown(true);
  };
  const closeDropdown = () => {
    setShowDropdown(false);
  };
  return (
    <>
      {urls.length === 1 && urls[0] ? (
        <a href={urls[0]} target="_blank" rel="noreferrer" className={classes(styles.link, type)}>
          <LinkIcon link={urls[0]} />
          Join
        </a>
      ) : urls.length > 1 ? (
        <div
          className={styles.links}
          tabIndex={0}
          onMouseEnter={openDropdown}
          onMouseLeave={closeDropdown}
          onFocusCapture={openDropdown}
        >
          <button className={classes(type, showDropdown && styles.active)} tabIndex={-1} type="button">
            Links {showDropdown ? "▴" : "▾"}
          </button>
          {showDropdown && (
            <ul className={styles.dropdown}>
              {urls.map((url) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noreferrer" className={styles.link}>
                    <LinkIcon link={url} />
                    Join
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </>
  );
};

export default TimetableLink;
