import { Helmet } from 'react-helmet-async';
import { DocumentTitleProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

/**
 * A component to change the document title of the page.
 */
export const DocumentTitle: Snail.FCC<DocumentTitleProps> = ({ children }) => {
  return (
    <Helmet>
      <title>{String(children)}</title>
    </Helmet>
  );
};
