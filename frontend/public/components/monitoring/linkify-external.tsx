import * as React from 'react';
import Linkify from 'react-linkify';
import { isSafeExternalURL } from './utils';

// Only HTTP(S) URLs in alert annotations become links; other schemes (ftp:, mailto:, ...) stay text.
const SafeLink: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }> = ({
  href,
  ...props
}) => (isSafeExternalURL(href) ? <a href={href} {...props} /> : <>{props.children}</>);

// shortcut: monitoring-local; drop in favour of the shared LinkifyExternal once it validates schemes on this branch
export const LinkifyExternalSafe: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Linkify component={SafeLink} properties={{ target: '_blank', rel: 'noopener noreferrer' }}>
    {children}
  </Linkify>
);
LinkifyExternalSafe.displayName = 'LinkifyExternalSafe';
