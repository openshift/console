import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { EmptyBox } from '@console/internal/components/utils';
import { IdentityProvider } from '@console/internal/module/k8s';

export const IdentityProviders: React.FC<IdentityProvidersProps> = ({ identityProviders }) => {
  const { t } = useTranslation();
  return _.isEmpty(identityProviders) ? (
    <EmptyBox label={t('console-app~Identity providers')} />
  ) : (
    <div className="co-table-container">
      <table className="pf-v5-c-table pf-m-compact pf-m-border-rows">
        <thead className="pf-v5-c-table__thead">
          <tr className="pf-v5-c-table__tr">
            <th className="pf-v5-c-table__th">{t('console-app~Name')}</th>
            <th className="pf-v5-c-table__th">{t('console-app~Type')}</th>
            <th className="pf-v5-c-table__th">{t('console-app~Mapping method')}</th>
          </tr>
        </thead>
        <tbody className="pf-v5-c-table__tbody">
          {_.map(identityProviders, (idp) => (
            <tr className="pf-v5-c-table__tr" key={idp.name}>
              <td className="pf-v5-c-table__td" data-test-idp-name={idp.name}>
                {idp.name}
              </td>
              <td className="pf-v5-c-table__td" data-test-idp-type-for={idp.name}>
                {idp.type}
              </td>
              <td className="pf-v5-c-table__td" data-test-idp-mapping-for={idp.name}>
                {idp.mappingMethod || 'claim'}
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
};
