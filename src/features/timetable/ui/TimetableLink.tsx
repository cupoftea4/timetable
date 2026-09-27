import { CloseButton, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import type { FC } from "react";
import LinkIcon from "@/shared/LinkIcon";
import type { TimetableItemType } from "@/types/timetable";
import { parseLessonLink } from "@/utils/lessonLinks";
import Toast from "@/utils/toasts";
import { classes } from "../../../styles/utils";
import styles from "./TimetableLink.module.scss";

type OwnProps = {
  urls: string[];
  type: TimetableItemType;
};

const TimetableLink: FC<OwnProps> = ({ urls, type }) => {
  const entries = urls.map(parseLessonLink);
  const links = [...new Set(entries.flatMap((entry) => entry.links))];
  const hasDetails = entries.some((entry) => !entry.directUrl);
  const originalText = urls.join("\n\n");

  const copyDetails = () =>
    navigator.clipboard.writeText(originalText).then(
      () => Toast.success("Скопійовано"),
      (e) => Toast.error(e, "Не вдалося скопіювати. Виділіть текст вручну.")
    );

  return (
    <>
      {entries.length === 1 && !hasDetails && links[0] ? (
        <a href={links[0]} target="_blank" rel="noreferrer" className={classes(styles.link, type)}>
          <LinkIcon link={links[0]} />
          {new URL(links[0]).hostname}
        </a>
      ) : entries.length > 0 ? (
        <Popover as="nav" className={styles.links} aria-label={hasDetails ? "Деталі пари" : "Посилання пари"}>
          <PopoverButton className={type}>
            <span>{hasDetails ? "Деталі" : "Посилання"}</span>
            <svg className={styles.arrow} viewBox="0 0 16 16" aria-hidden="true">
              <path d="M12 6H4l4 4.5z" />
            </svg>
          </PopoverButton>
          <PopoverPanel
            transition
            anchor={{ to: "bottom end", gap: 8, padding: 8 }}
            className={classes(styles.dropdown, hasDetails && styles.details)}
          >
            {hasDetails ? (
              <>
                <div className={styles.originalText}>
                  {originalText.trim()
                    ? entries.map((entry, entryIndex) => (
                        <p key={entryIndex}>
                          {entry.parts.map((part, partIndex) =>
                            part.href ? (
                              <a key={partIndex} href={part.href} target="_blank" rel="noreferrer" title={part.text}>
                                {new URL(part.href).hostname}
                              </a>
                            ) : (
                              part.text
                            )
                          )}
                        </p>
                      ))
                    : "Деталей немає."}
                </div>
                <div className={styles.actions}>
                  <button type="button" onClick={copyDetails}>
                    Скопіювати
                  </button>
                </div>
              </>
            ) : (
              <ul>
                {links.map((url) => (
                  <li key={url}>
                    <CloseButton as="a" href={url} target="_blank" rel="noreferrer" className={styles.link}>
                      <LinkIcon link={url} />
                      {new URL(url).hostname}
                    </CloseButton>
                  </li>
                ))}
              </ul>
            )}
          </PopoverPanel>
        </Popover>
      ) : null}
    </>
  );
};

export default TimetableLink;
