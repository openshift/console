import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useActiveNamespace } from 'packages/console-shared/src';
import { resourcePathFromModel } from 'public/components/utils';
import { NetworkPolicyModel } from 'public/models';
import { NetworkPolicyForm } from './network-policy-form';

import './_create-network-policy.scss';

export const CreateNetworkPolicy: React.FC<{}> = () => {
  const { t } = useTranslation();
  const namespaceProps = {
    namespace: useActiveNamespace()[0],
  };
  return (
    <div className="co-m-pane__body co-m-pane__form">
      <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
        <div className="co-m-pane__name">{t('public~Create NetworkPolicy')}</div>
        <div className="co-m-pane__heading-link">
          <Link
            to={`${resourcePathFromModel(
              NetworkPolicyModel,
              undefined,
              namespaceProps.namespace,
            )}/~new`}
            id="yaml-link"
            data-test="yaml-link"
            replace
          >
            {t('public~Edit YAML')}
          </Link>
        </div>
      </h1>
      <p className="co-m-pane__explanation">
        {t(
          'public~NetworkPolicy can specify how Pods are allowed to communicate with various network entities.',
        )}
      </p>
      <NetworkPolicyForm {...namespaceProps} />
    </div>
  );
};
