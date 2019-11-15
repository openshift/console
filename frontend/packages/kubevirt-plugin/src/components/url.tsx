import * as React from 'react';
import { Link } from 'react-router-dom';
import { parseUrl } from '../utils/url';

const ELIPSIS = '…';

const elipsizeLeft = (word: string) => `${ELIPSIS}${word}`;

const resolveOrigin = (
  { hostname, origin, port }: { hostname: string; origin: string; port: number },
  maxHostnameParts: number,
): string => {
  const hostnameParts = hostname.split('.');
  if (hostnameParts.length <= maxHostnameParts) {
    return origin;
  }

  const resolvedHostname = hostnameParts.slice(hostnameParts.length - maxHostnameParts).join('.');
  const resolvedPort = port ? `:${port}` : '';

  return `${elipsizeLeft(resolvedHostname)}${resolvedPort}`;
};

const resolvePathname = ({ pathname }: { pathname: string }, maxPathnameParts: number): string => {
  const pathnameParts = pathname.split('/').filter((part) => part);
  if (pathnameParts.length <= maxPathnameParts) {
    return pathname;
  }

  const resolvedPathname = pathnameParts.slice(pathnameParts.length - maxPathnameParts).join('/');
  return `/${elipsizeLeft(`/${resolvedPathname}`)}`;
};

const resolveUrl = ({ urlObj, maxHostnameParts, maxPathnameParts }) =>
  `${resolveOrigin(urlObj, maxHostnameParts)}${resolvePathname(urlObj, maxPathnameParts)}`;

export const Url: React.FC<UrlPorps> = ({
  url,
  isShort = false,
  maxHostnameParts = 3,
  maxPathnameParts = 1,
}) => {
  const urlObj = isShort ? parseUrl(url) : undefined;

  const resolvedUrl = urlObj ? resolveUrl({ urlObj, maxHostnameParts, maxPathnameParts }) : url;
  const resolvedTitle = resolvedUrl === url ? undefined : url;

  return (
    <Link to={url} title={resolvedTitle}>
      {resolvedUrl}
    </Link>
  );
};

type UrlPorps = {
  url: string;
  isShort?: boolean;
  maxHostnameParts?: number;
  maxPathnameParts?: number;
};

/*
Url.propTypes = {
  url: PropTypes.string.isRequired,
  short: PropTypes.bool,
  maxHostnameParts: PropTypes.number,
  maxPathnameParts: PropTypes.number,
};

Url.defaultProps = {
  short: false,
  maxHostnameParts: 3,
  maxPathnameParts: 1,
};
*/
