import React, { type FC } from 'react';
import DefaultLink from '@/assets/links/DefaultLink';
import DiscordIcon from '@/assets/links/DiscordIcon';
import GoogleMeetsIcon from '@/assets/links/GoogleMeetsIcon';
import SkypeIcon from '@/assets/links/SkypeIcon';
import TeamsIcon from '@/assets/links/TeamsIcon';
import YouTubeIcon from '@/assets/links/YouTubeIcon';
import ZoomIcon from '@/assets/links/ZoomIcon';

type OwnProps = {
  link: string
};

const linkIcons: Readonly<Record<string, () => JSX.Element>> = {
  zoom: ZoomIcon,
  teams: TeamsIcon,
  google: GoogleMeetsIcon,
  discord: DiscordIcon,
  youtube: YouTubeIcon,
  'youtu.be': YouTubeIcon,
  skype: SkypeIcon
};

const LinkIcon: FC<OwnProps> = ({ link }) => {
  const linkIcon = Object.keys(linkIcons).find((key) => link.includes(key));

  return (
    <>
      {
        linkIcon ? React.createElement(linkIcons[linkIcon]!) : <DefaultLink />
      }
    </>
  );
};

export default LinkIcon;
