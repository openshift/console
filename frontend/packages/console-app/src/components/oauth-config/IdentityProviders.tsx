import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useModal } from '@console/dynamic-plugin-sdk/src/app/modal-support/useModal';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import {
  RemoveIdentityProviderModal,
  RemoveIdentityProvider,
} from '@console/internal/components/modals/remove-idp-modal';
import { Kebab, EmptyBox } from '@console/internal/components/utils';
import { IdentityProvider, OAuthKind } from '@console/internal/module/k8s';

export const IdentityProviders: React.FC<IdentityProvidersProps> = ({ identityProviders, obj }) => {
  const { t } = useTranslation();
  const launcher = useModal();
  const groupVersionKind = getGroupVersionKindForResource(obj);
  const [model] = useK8sModel(groupVersionKind);
  const launchModal = React.useCallback(
    (index, name, type) => {
      if (obj && model) {
        launcher<RemoveIdentityProvider>(RemoveIdentityProviderModal, {
          obj,
          model,
          index,
          name,
          type,
        });
      }
    },
    [launcher, model, obj],
  );

  return _.isEmpty(identityProviders) ? (
    <EmptyBox label={t('console-app~Identity providers')} />
  ) : (
    <div className="co-table-container">
      <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
        <thead className="pf-v6-c-table__thead">
          <tr className="pf-v6-c-table__tr">
            <th className="pf-v6-c-table__th">{t('console-app~Name')}</th>
            <th className="pf-v6-c-table__th">{t('console-app~Type')}</th>
            <th className="pf-v6-c-table__th">{t('console-app~Mapping method')}</th>
          </tr>
        </thead>
        <tbody className="pf-v6-c-table__tbody">
          {_.map(identityProviders, (idp, index) => (
            <tr className="pf-v6-c-table__tr" key={idp.name}>
              <td className="pf-v6-c-table__td" data-test-idp-name={idp.name}>
                {idp.name}
              </td>
              <td className="pf-v6-c-table__td" data-test-idp-type-for={idp.name}>
                {idp.type}
              </td>
              <td className="pf-v6-c-table__td" data-test-idp-mapping-for={idp.name}>
                {idp.mappingMethod || 'claim'}
              </td>
              <td className="pf-v6-c-table__td" data-test-idp-kebab-for={idp.name}>
                <Kebab
                  options={[
                    {
                      label: t('console-app~Remove identity provider'),
                      callback: () => launchModal(index, idp.name, idp.type),
                    },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

type IdentityProvidersProps = {
  identityProviders: IdentityProvider[];
  obj: OAuthKind;
};
