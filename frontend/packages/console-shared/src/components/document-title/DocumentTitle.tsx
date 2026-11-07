import type { FC } from 'react';
import type { DocumentTitleProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { getBrandingDetails } from '@console/internal/components/utils/branding';

const { productName } = getBrandingDetails();

/**
 * A component to change the document title of the page.
 */
export const DocumentTitle: FC<DocumentTitleProps> = ({ children }) => (
  <title>{`${String(children)} · ${productName}`}</title>
);
