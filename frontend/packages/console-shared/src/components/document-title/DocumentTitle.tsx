import { Helmet } from 'react-helmet-async';
import { DocumentTitleProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

/**
 * A component to change the document title of the page.
 */
export const DocumentTitle: React.FCC<DocumentTitleProps> = ({ children, ...props }) => {
  return (
    <Helmet>
      <title {...props}>{String(children)}</title>
    </Helmet>
  );
};
