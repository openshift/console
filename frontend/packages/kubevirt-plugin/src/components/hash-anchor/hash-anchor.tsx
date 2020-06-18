import * as React from 'react';
import { LinkIcon } from '@patternfly/react-icons';

import './hash-anchor.scss';

type HashAnchorProps = {
  hash: string;
};

export const HashAnchor: React.FC<HashAnchorProps> = ({ hash }) => {
  const finalHash = hash?.startsWith('#') ? hash : `#${hash}`;
  const { location } = window;
  const aRef = React.useRef(null);

  React.useEffect(() => {
    const { current } = aRef;
    if (current && hash && location.href.includes(finalHash)) {
      current.scrollIntoView({
        behaviour: 'smooth',
        block: 'start',
        inline: 'center',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aRef.current]);

  if (!hash) {
    return null;
  }

  const href = `${location.pathname}${finalHash}`;

  return (
    <a href={href} ref={aRef} className="kv-hash-anchor">
      <LinkIcon />
    </a>
  );
};
