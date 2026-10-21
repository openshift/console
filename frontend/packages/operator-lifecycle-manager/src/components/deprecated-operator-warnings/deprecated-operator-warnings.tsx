import type { FC } from 'react';
import { useState } from 'react';
import { Label, Alert, Tooltip, AlertActionCloseButton } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { YellowExclamationTriangleIcon } from '@console/dynamic-plugin-sdk/src/api/core-api';
import type { DeprecatedOperatorWarning, SubscriptionKind } from '../../types';

export enum DeprecatedOperatorType {
  PackageDeprecated = 'PackageDeprecated',
  ChannelDeprecated = 'ChannelDeprecated',
  VersionDeprecated = 'BundleDeprecated',
}
const findDeprecation = (obj: SubscriptionKind, type: string): DeprecatedOperatorWarning => {
  return { deprecation: obj?.status?.conditions?.find((f) => f.type === type) };
};

export const findDeprecatedOperator = (
  obj: SubscriptionKind,
): {
  deprecatedPackage: DeprecatedOperatorWarning;
  deprecatedChannel: DeprecatedOperatorWarning;
  deprecatedVersion: DeprecatedOperatorWarning;
} => {
  return {
    deprecatedPackage: findDeprecation(obj, DeprecatedOperatorType.PackageDeprecated),
    deprecatedChannel: findDeprecation(obj, DeprecatedOperatorType.ChannelDeprecated),
    deprecatedVersion: findDeprecation(obj, DeprecatedOperatorType.VersionDeprecated),
  };
};

export const DeprecatedOperatorWarningBadge: FC<DeprecatedOperatorWarningBadge> = ({
  deprecation,
  className,
}) => {
  const { t } = useTranslation();

  return (
    <Tooltip content={t('olm~Deprecated: {{message}}', { message: deprecation?.message })}>
      <Label
        data-test="deprecated-operator-warning-badge"
        status="warning"
        variant="outline"
        className={className}
      >
        {t('olm~Deprecated')}
      </Label>
    </Tooltip>
  );
};

export const DeprecatedOperatorWarningIcon: FC<DeprecatedOperatorWarningIcon> = ({
  deprecation,
  dataTest,
}) => {
  const { t } = useTranslation();

  return (
    <Tooltip content={t('olm~Deprecated: {{message}}', { message: deprecation?.message })}>
      <YellowExclamationTriangleIcon dataTest={dataTest} className="pf-v6-u-ml-xs" />
    </Tooltip>
  );
};

export const DeprecatedOperatorWarningAlert: FC<DeprecatedOperatorWarningProps> = ({
  deprecatedPackage,
  deprecatedChannel,
  deprecatedVersion,
  dismissible,
}) => {
  const { t } = useTranslation();
  const [alertVisible, setAlertVisible] = useState<boolean>(true);

  return (
    alertVisible && (
      <Alert
        variant="warning"
        title={t('olm~Deprecation warnings')}
        aria-live="polite"
        isInline
        actionClose={
          dismissible && <AlertActionCloseButton onClose={() => setAlertVisible(false)} />
        }
      >
        <div data-test="deprecated-operator-warning-package">
          {deprecatedPackage?.deprecation?.message}
        </div>
        <div data-test="deprecated-operator-warning-channel">
          {deprecatedChannel?.deprecation?.message}
        </div>
        <div data-test="deprecated-operator-warning-version">
          {deprecatedVersion?.deprecation?.message}
        </div>
      </Alert>
    )
  );
};

type DeprecatedOperatorWarningBadge = {
  className?: string;
} & DeprecatedOperatorWarning;

type DeprecatedOperatorWarningIcon = {
  dataTest?: string;
} & DeprecatedOperatorWarning;

type DeprecatedOperatorWarningProps = {
  deprecatedPackage: DeprecatedOperatorWarning;
  deprecatedChannel: DeprecatedOperatorWarning;
  deprecatedVersion: DeprecatedOperatorWarning;
  dismissible?: boolean;
};
