import { type FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import LinkIcon from "@/shared/LinkIcon";
import type { TimetableItemType } from "@/types/timetable";
import { parseLessonLink } from "@/utils/lessonLinks";
import { classes } from "../../../styles/utils";
import styles from "./TimetableLink.module.scss";

type OwnProps = {
  urls: string[];
  type: TimetableItemType;
};

type CopyStatus = "idle" | "copied" | "failed";

const POPUP_MARGIN = 8;
const POPUP_GAP = 4;

const TimetableLink: FC<OwnProps> = ({ urls, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const menuRef = useRef<HTMLElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const entries = urls.map(parseLessonLink);
  const links = [...new Set(entries.flatMap((entry) => entry.links))];
  const hasDetails = entries.some((entry) => !entry.directUrl);
  const originalText = urls.join("\n\n");

  const open = () => {
    setCopyStatus("idle");
    setIsOpen(true);
  };
  const close = () => {
    setIsOpen(false);
    setCopyStatus("idle");
  };

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(originalText);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  useEffect(() => {
    if (copyStatus !== "copied") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2000);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  useEffect(() => {
    if (!isOpen) return;
    const dismiss = (event: Event) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("scroll", dismiss, true);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("scroll", dismiss, true);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    const popup = popupRef.current;
    const menu = menuRef.current;
    if (!isOpen || !hasDetails || !popup || !menu) return;

    if (!popup.matches(":popover-open")) popup.showPopover();
    const anchor = menu.getBoundingClientRect();
    const maxLeft = window.innerWidth - popup.offsetWidth - POPUP_MARGIN;
    const maxTop = window.innerHeight - popup.offsetHeight - POPUP_MARGIN;
    popup.style.left = `${Math.max(POPUP_MARGIN, Math.min(anchor.right - popup.offsetWidth, maxLeft))}px`;
    popup.style.top = `${Math.max(POPUP_MARGIN, Math.min(anchor.bottom + POPUP_GAP, maxTop))}px`;
  }, [hasDetails, isOpen]);

  const copyMessage =
    copyStatus === "copied"
      ? "Copied!"
      : copyStatus === "failed"
        ? "Couldn't copy. Select the text to copy it manually."
        : null;
  return (
    <>
      {entries.length === 1 && !hasDetails && links[0] ? (
        <a href={links[0]} target="_blank" rel="noreferrer" className={classes(styles.link, type)}>
          <LinkIcon link={links[0]} />
          Join
        </a>
      ) : entries.length > 0 ? (
        <nav
          ref={menuRef}
          className={styles.links}
          aria-label={hasDetails ? "Lesson details" : "Lesson links"}
          onMouseEnter={() => {
            if (!hasDetails) open();
          }}
          onMouseLeave={() => {
            if (!hasDetails) close();
          }}
          onBlurCapture={(event) => {
            if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) close();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
              event.currentTarget.querySelector("button")?.focus();
            }
          }}
        >
          <button
            className={type}
            type="button"
            aria-expanded={isOpen}
            onClick={() => {
              if (hasDetails && isOpen) close();
              else open();
            }}
          >
            <span>{hasDetails ? "Details" : "Links"}</span>
            <svg className={styles.arrow} viewBox="0 0 16 16" aria-hidden="true">
              <path d="M12 6H4l4 4.5z" />
            </svg>
          </button>
          {isOpen && (
            <div
              ref={popupRef}
              className={classes(styles.dropdown, hasDetails && styles.details)}
              popover={hasDetails ? "manual" : undefined}
            >
              {hasDetails && (
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
                      : "No details provided."}
                  </div>
                  <div className={styles.actions}>
                    {copyMessage && <span role="status">{copyMessage}</span>}
                    <button type="button" onClick={copyDetails}>
                      Copy
                    </button>
                  </div>
                </>
              )}
              {!hasDetails && links.length > 0 && (
                <ul>
                  {links.map((url) => (
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
          )}
        </nav>
      ) : null}
    </>
  );
};

export default TimetableLink;
