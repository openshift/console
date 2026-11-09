import type { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import type { DocumentTitleProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

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
  <Helmet>
    <title {...(__internal_data_telemetry ? { 'data-telemetry': __internal_data_telemetry } : {})}>
      {String(children)}
    </title>
  </Helmet>
);
