import { FC, useState } from 'react'
import DefaultLink from '../assets/links/DefaultLink';
import DiscordIcon from '../assets/links/DiscordIcon';
import GoogleMeetsIcon from '../assets/links/GoogleMeetsIcon';
import SkypeIcon from '../assets/links/SkypeIcon';
import TeamsIcon from '../assets/links/TeamsIcon';
import YouTubeIcon from '../assets/links/YouTubeIcon';
import ZoomIcon from '../assets/links/ZoomIcon';
import { TimetableItemType } from '../utils/types';
import styles from './TimetableLink.module.scss'

type OwnProps = {
  urls: string[];
  type: TimetableItemType;
}

const getLinkIcon = (link: string) => {
  if (link.includes("zoom")) return <ZoomIcon/>;
  if (link.includes("teams")) return <TeamsIcon/>;
  if (link.includes("google")) return <GoogleMeetsIcon />;
  if (link.includes("discord")) return <DiscordIcon />;
  if (link.includes("youtube")) return <YouTubeIcon />;
  if (link.includes("youtu.be")) return <YouTubeIcon />;
  if (link.includes("skype")) return <SkypeIcon />
  return <DefaultLink/>;
}

const TimetableLink: FC<OwnProps>  = ({ urls, type }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const openDropdown = () => setShowDropdown(true);
  const closeDropdown = () => setShowDropdown(false);
  return (
    <>
      {urls.length === 1 ? 
        <a href={urls[0]} target="_blank" rel="noreferrer"
          className={`${styles.link} ${type}`}
        >
          {getLinkIcon(urls[0])}
          Join
        </a>
        : urls.length > 1 ?
          <div className={styles.links} tabIndex={0}
          onMouseEnter={openDropdown}  onMouseLeave={closeDropdown} 
          onFocusCapture={openDropdown}
          >
            <button className={`${type} ${showDropdown && styles.active}`} tabIndex={-1}>
              Links {showDropdown ? "▴" : "▾"}
            </button>
              {showDropdown &&
                <ul className={styles.dropdown}>
                  {urls.map((url, index) => (
                    <li key={index}>
                      <a href={url}
                        target="_blank" rel="noreferrer"
                        className={`${styles.link}`}
                      >
                        {getLinkIcon(url)}
                        Join
                      </a>
                    </li>
                  ))}
                </ul>
              }
          </div>
      : null}
    </>
  )
}

export default TimetableLink;