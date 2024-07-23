import * as React from 'react';
import { Label, FormAlert, Alert, Tooltip, AlertActionCloseButton } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { YellowExclamationTriangleIcon } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { DeprecatedOperatorWarning } from '@console/operator-lifecycle-manager/src/types';
import { SubscriptionKind } from '../../types';

export enum DeprecatedOperatorType {
  PackageDeprecated = 'PackageDeprecated',
  ChannelDeprecated = 'ChannelDeprecated',
  BundleDeprecated = 'BundleDeprecated',
}

export const findDeprecatedOperatorByType = (
  obj: SubscriptionKind,
  type: string,
): DeprecatedOperatorWarning => {
  const deprecation = obj?.status?.conditions?.find((f) => f.type === type);
  return { deprecation };
};

export const DeprecatedOperatorWarningBadge: React.FC<DeprecatedOperatorWarningBadge> = ({
  deprecation,
  className,
}) => {
  const { t } = useTranslation();

  return (
    <Tooltip content={t('olm~Deprecated: {{message}}', { message: deprecation?.message })}>
      <Label color="orange" className={className} icon={<YellowExclamationTriangleIcon />}>
        {t('olm~Deprecated')}
      </Label>
    </Tooltip>
  );
};

export const DeprecatedOperatorWarningIcon: React.FC<DeprecatedOperatorWarning> = ({
  deprecation,
}) => {
  const { t } = useTranslation();

  return (
    <Tooltip content={t('olm~Deprecated: {{message}}', { message: deprecation?.message })}>
      <YellowExclamationTriangleIcon className="pf-v5-u-ml-xs" />
    </Tooltip>
  );
};

export const DeprecatedOperatorWarningAlert: React.FC<DeprecatedOperatorWarningProps> = ({
  deprecatedPackage,
  deprecatedChannel,
  deprecatedVersion,
  dismissible,
}) => {
  const { t } = useTranslation();
  const [alertVisible, setAlertVisible] = React.useState<boolean>(true);

  return (
    alertVisible && (
      <FormAlert className="pf-v5-u-my-md">
        <Alert
          variant="warning"
          title={t('olm~Deprecated warnings')}
          aria-live="polite"
          isInline
          actionClose={
            dismissible && <AlertActionCloseButton onClose={() => setAlertVisible(false)} />
          }
        >
          <div>{deprecatedPackage?.deprecation?.message}</div>
          <div>{deprecatedChannel?.deprecation?.message}</div>
          <div>{deprecatedVersion?.deprecation?.message}</div>
        </Alert>
      </FormAlert>
    )
  );
};

type DeprecatedOperatorWarningBadge = {
  className?: string;
} & DeprecatedOperatorWarning;

type DeprecatedOperatorWarningProps = {
  deprecatedPackage: DeprecatedOperatorWarning;
  deprecatedChannel: DeprecatedOperatorWarning;
  deprecatedVersion: DeprecatedOperatorWarning;
  dismissible?: boolean;
};
