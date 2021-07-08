import * as React from 'react';
import { Alert, Flex } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { PageHeading, ResourceLink } from '@console/internal/components/utils';

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
  const { t } = useTranslation();
  return (
    <PageHeading>
      <Flex direction={{ default: 'column' }}>
        <h1 className="pf-c-title pf-m-2xl">{title}</h1>
        {validSupportedType ? (
          <>
            <div>
              {t('devconsole~Resource')}{' '}
              <ResourceLink inline linkTo={false} kind={kind} name={name} />
            </div>
            {loadError ? (
              <Alert
                isInline
                variant="danger"
                title={t('devconsole~This resource is not available')}
              >
                {loadError}
              </Alert>
            ) : (
              limitWarning && <Alert isInline variant="warning" title={limitWarning} />
            )}
          </>
        ) : (
          <Alert
            isInline
            variant="danger"
            title={t('devconsole~This is not a supported in-context type')}
          />
        )}
      </Flex>
    </PageHeading>
  );
};

export default HPAPageHeader;
