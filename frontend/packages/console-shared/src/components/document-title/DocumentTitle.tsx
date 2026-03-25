import type { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import type { DocumentTitleProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

/**
 * A component to change the document title of the page.
 */
export const DocumentTitle: FC<DocumentTitleProps> = ({ children }) => {
  return (
    <Helmet>
      <title>{String(children)}</title>
    </Helmet>
  );
};
