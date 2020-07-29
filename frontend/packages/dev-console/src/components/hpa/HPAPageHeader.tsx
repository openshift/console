import * as React from 'react';
import { Alert, Flex } from '@patternfly/react-core';
import { ResourceLink } from '@console/internal/components/utils';

type HPAPageHeaderProps = {
  kind: string;
  limitWarning?: string;
  loadError?: string;
  name: string;
  title: string;
  validSupportedType: boolean;
};

const HPAPageHeader: React.FC<HPAPageHeaderProps> = ({
  name,
  title,
  kind,
  loadError,
  limitWarning,
  validSupportedType,
}) => {
  return (
    <Flex direction={{ default: 'column' }}>
      <h1 className="pf-c-title pf-m-2xl">{title}</h1>
      {validSupportedType ? (
        <>
          <div>
            Resource <ResourceLink inline linkTo={false} kind={kind} name={name} />
          </div>
          {loadError && (
            <Alert isInline variant="danger" title="This resource is not available">
              {loadError}
            </Alert>
          )}
          {limitWarning && <Alert isInline variant="warning" title={limitWarning} />}
        </>
      ) : (
        <Alert isInline variant="danger" title="This is not a supported in-context type" />
      )}
    </Flex>
  );
};

export default HPAPageHeader;
