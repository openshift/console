import type { FC } from 'react';
import type { DocumentTitleProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { getBrandingDetails } from '@console/internal/components/utils/branding';

const { productName } = getBrandingDetails();

interface InternalDocumentTitleProps extends DocumentTitleProps {
  /** Core console use only: applies data-telemetry attribute to the document title */
  __internal_data_telemetry?: string;
}

/**
 * A component to change the document title of the page.
 */
export const DocumentTitle: FC<InternalDocumentTitleProps> = ({
  children,
  __internal_data_telemetry,
}) => (
  <title {...(__internal_data_telemetry ? { 'data-telemetry': __internal_data_telemetry } : {})}>
    {`${String(children)} · ${productName}`}
  </title>
);
