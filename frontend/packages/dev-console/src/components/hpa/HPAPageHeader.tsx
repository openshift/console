import type { FC } from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';

type HPAPageHeaderProps = {
  kind: string;
  limitWarning?: string;
  loadError?: string;
  name: string;
  title: string;
  validSupportedType: boolean;
};

const HPAPageHeader: FC<HPAPageHeaderProps> = ({
  name,
  title,
  kind,
  loadError,
  limitWarning,
  validSupportedType,
}) => {
  const { t } = useTranslation('devconsole');
  return (
    <PageHeading
      title={title}
      helpAlert={
        validSupportedType ? (
          <>
            <div>
              {t('Resource')} <ResourceLink inline linkTo={false} kind={kind} name={name} />
            </div>
            {loadError ? (
              <Alert isInline variant="danger" title={t('This resource is not available')}>
                {loadError}
              </Alert>
            ) : (
              limitWarning && <Alert isInline variant="warning" title={limitWarning} />
            )}
          </>
        ) : (
          <Alert isInline variant="danger" title={t('This is not a supported in-context type')} />
        )
      }
    />
  );
};

export default HPAPageHeader;
