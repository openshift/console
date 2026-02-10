import { AlertGroup, Flex, ModalFooter } from '@patternfly/react-core';
import { ErrorMessage, InfoMessage } from '@console/internal/components/utils/button-bar';

export const ModalFooterWithAlerts: React.FC<ModalFooterWithAlertsProps> = ({
  children,
  errorMessage,
  message,
}) => (
  <ModalFooter className="pf-v6-u-flex-wrap">
    {(errorMessage || message) && (
      <AlertGroup
        isLiveRegion
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions text"
        className="pf-v6-u-w-100"
      >
        {errorMessage && <ErrorMessage message={errorMessage} />}
        {message && <InfoMessage message={message} />}
      </AlertGroup>
    )}
    <Flex spaceItems={{ default: 'spaceItemsSm' }}>{children}</Flex>
  </ModalFooter>
);

type ModalFooterWithAlertsProps = {
  children: React.ReactNode;
  message?: string;
  errorMessage?: string;
};
