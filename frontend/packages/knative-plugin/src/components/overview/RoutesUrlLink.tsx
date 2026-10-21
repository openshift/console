import type { FC } from 'react';
import { ClipboardCopy } from '@patternfly/react-core/dist/dynamic/components/ClipboardCopy';
import { ExternalLinkWithCopy } from '@console/internal/components/utils';

export type RoutesUrlLinkProps = {
  urls: string[];
  title?: string;
};

const RoutesUrlLink: FC<RoutesUrlLinkProps> = ({ urls = [], title }) =>
  urls.length > 0 && (
    <>
      {title && <span className="pf-v6-u-text-color-subtle">{title}: </span>}
      {urls.map((url) =>
        url?.endsWith('svc.cluster.local') ? (
          <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
            {url}
          </ClipboardCopy>
        ) : (
          <ExternalLinkWithCopy key={url} href={url} text={url} displayBlock />
        ),
      )}
    </>
  );

export default RoutesUrlLink;
