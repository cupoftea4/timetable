import { type FC, useState } from "react";
import LinkIcon from "@/shared/LinkIcon";
import type { TimetableItemType } from "@/types/timetable";
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
        <nav
          className={styles.links}
          aria-label="Lesson links"
          onMouseEnter={openDropdown}
          onMouseLeave={closeDropdown}
          onFocusCapture={openDropdown}
        >
          <button className={type} type="button" aria-expanded={showDropdown}>
            <span>Links</span>
            <svg className={styles.arrow} viewBox="0 0 16 16" aria-hidden="true">
              <path d="M12 6H4l4 4.5z" />
            </svg>
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
        </nav>
      ) : null}
    </>
  );
};

export default TimetableLink;
