import * as React from 'react';
import { ClipboardCopy } from '@patternfly/react-core/dist/esm/components/ClipboardCopy';
import { ExternalLink } from '@console/internal/components/utils';

export type RoutesUrlLinkProps = {
  urls: string[];
  title?: string;
};

const RoutesUrlLink: React.FC<RoutesUrlLinkProps> = ({ urls = [], title }) =>
  urls.length > 0 && (
    <>
      {title && <span className="text-muted">{title}: </span>}
      {urls.map((url) =>
        url?.endsWith('svc.cluster.local') ? (
          <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
            {url}
          </ClipboardCopy>
        ) : (
          <ExternalLink
            key={url}
            href={url}
            text={url}
            additionalClassName="co-external-link--block"
          />
        ),
      )}
    </>
  );

export default RoutesUrlLink;
