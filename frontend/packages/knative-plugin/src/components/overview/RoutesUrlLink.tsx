import * as React from 'react';
import { ExternalLink } from '@console/internal/components/utils';

export type RoutesUrlLinkProps = {
  urls: string[];
  title?: string;
};

const RoutesUrlLink: React.FC<RoutesUrlLinkProps> = ({ urls = [], title }) =>
  urls.length > 0 && (
    <>
      {title && <span className="text-muted">{title}: </span>}
      {urls.length > 0 &&
        urls.map((url) => (
          <ExternalLink href={url} additionalClassName="co-external-link--block" text={url} />
        ))}
    </>
  );

export default RoutesUrlLink;
