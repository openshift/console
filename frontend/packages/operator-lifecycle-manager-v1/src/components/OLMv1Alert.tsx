import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';

const OLMv1Alert = () => {
  const { t } = useTranslation('olm-v1');
  return (
    <Alert
      variant="info"
      title={t('Operator Lifecycle Management version 1')}
      actionLinks={
        <ExternalLink href={`${window.SERVER_FLAGS.documentationBaseURL}/html/operators/olm-v1`}>
          {t('Learn more about OLMv1')}
        </ExternalLink>
      }
    >
      {t(
        "With OLMv1, you'll get a much simpler API that's easier to work with and understand. Plus, you have more direct control over updates. You can define update ranges and decide exactly how they are rolled out.",
      )}
    </Alert>
  );
};

export default OLMv1Alert;
