import type { ReactNode, ComponentProps } from 'react';
import { useState } from 'react';
import * as _ from 'lodash-es';
import Linkify from 'react-linkify';
import { useTranslation } from 'react-i18next';
import { ClipboardCopyButton } from '@patternfly/react-core';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { css } from '@patternfly/react-styles';

// Kubernetes "dns-friendly" names match
// [a-z0-9]([-a-z0-9]*[a-z0-9])?  and are 63 or fewer characters
// long. This pattern checks the pattern but not the length.
//
// Don't capture anything in legalNamePattern, since it's used
// in expressions like
//
//    new RegExp("PREFIX" + legalNamePattern.source + "(SUFFIX)")
//
// And it's ok for users to make assumptions about capturing groups.

export const legalNamePattern = /[a-z0-9](?:[-a-z0-9]*[a-z0-9])?/;

const basePathPattern = new RegExp(`^/?${window.SERVER_FLAGS.basePath}`);

export const namespacedPrefixes = [
  '/api-resource',
  '/k8s',
  '/operatorhub',
  '/operatormanagement',
  '/operators',
  '/details',
  '/search',
  '/status',
];

export const stripBasePath = (path: string): string => path.replace(basePathPattern, '/');

export const getNamespace = (path: string): string => {
  path = stripBasePath(path);
  const split = path.split('/').filter((x) => x);

  if (split[1] === 'all-namespaces') {
    return ALL_NAMESPACES_KEY;
  }

  let ns: string;
  if (split[1] === 'cluster' && ['namespaces', 'projects'].includes(split[2]) && split[3]) {
    ns = split[3];
  } else if (split[1] === 'ns' && split[2]) {
    ns = split[2];
  } else {
    return;
  }

  const match = ns.match(legalNamePattern);
  return match && match.length > 0 && match[0];
};

export const getURLSearchParams = () => {
  const all: any = {};
  const params = new URLSearchParams(window.location.search);

  for (const [k, v] of params.entries()) {
    all[k] = v;
  }

  return all;
};

// Opens link with copy-to-clipboard

export const ExternalLinkWithCopy = ({
  href,
  text,
  className,
  displayBlock,
  ...props
}: ExternalLinkWithCopyProps) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const clipboardCopyFunc = (event, txt) => {
    navigator.clipboard.writeText(txt.toString());
  };
  const onClick = (event, txt) => {
    clipboardCopyFunc(event, txt);
    setCopied(true);
  };

  const copyToClipboardText = t('public~Copy to clipboard');
  const tooltipText = copied ? t('public~Copied') : copyToClipboardText;
  const tooltipContent = [
    <span className="co-nowrap" key="nowrap">
      {tooltipText}
    </span>,
  ];
  const textId = _.uniqueId('link-content-');
  const displayText = text || href;

  return (
    <div
      className={css(
        'pf-v6-c-clipboard-copy',
        'pf-m-inline',
        { 'pf-m-block': displayBlock },
        className,
      )}
    >
      <span className="pf-v6-c-clipboard-copy__text">
        <ExternalLink href={href} isInline {...props}>
          {displayText}
        </ExternalLink>
      </span>
      <span className="pf-v6-c-clipboard-copy__actions">
        <span className="pf-v6-c-clipboard-copy__actions-item">
          <ClipboardCopyButton
            id={_.uniqueId('clipboard-copy-button-')}
            textId={textId}
            aria-label={copyToClipboardText}
            onClick={(e) => onClick(e, displayText)}
            exitDelay={copied ? 1250 : 600}
            variant="plain"
            hasNoPadding
            maxWidth="120px"
            onTooltipHidden={() => setCopied(false)}
          >
            {tooltipContent}
          </ClipboardCopyButton>
        </span>
      </span>
    </div>
  );
};

// Open links in a new window and set noopener/noreferrer.
export const LinkifyExternal = ({ children }: { children: ReactNode }) => (
  <Linkify component={ExternalLink}>{children}</Linkify>
);
LinkifyExternal.displayName = 'LinkifyExternal';

type ExternalLinkWithCopyProps = ComponentProps<typeof ExternalLink> & {
  href: string;
  text?: string;
};
