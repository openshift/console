/* eslint-disable @typescript-eslint/no-use-before-define */
import type { ReactNode } from 'react';
import { Divider, ButtonVariant } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { RoleModel, ClusterRoleModel } from '../../models';
import { k8sPatch } from '../../module/k8s';
import type { K8sResourceKind } from '../../module/k8s/types';
import type { RootState } from '../../redux';
import { Kebab } from '../utils/kebab';
import { ResourceIcon } from '../utils/resource-icon';
import { EmptyBox } from '../utils/status-box';

export interface RoleRule {
  verbs?: string[];
  apiGroups?: string[];
  resources?: string[];
  resourceNames?: string[];
  nonResourceURLs?: string[];
}

export interface RoleKind extends K8sResourceKind {
  rules?: RoleRule[];
}

export const RulesList: React.FC<{ rules: RoleRule[]; name: string; namespace?: string }> = ({
  rules,
  name,
  namespace,
}) => {
  const { t } = useTranslation('public');
  return _.isEmpty(rules) ? (
    <EmptyBox label={t('Rules')} />
  ) : (
    <Table gridBreakPoint="">
      <Thead>
        <Tr>
          <Th>{t('Verbs')}</Th>
          <Th visibility={['hidden', 'visibleOnSm']}>{t('API groups')}</Th>
          <Th>{t('Resources')}</Th>
          <Th>{t('Resource names')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rules.map((rule, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <Tr key={i}>
            {/* eslint-disable-next-line no-use-before-define */}
            <Rule {...rule} name={name} namespace={namespace} i={i} />
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

const Actions = ({ verbs }: { verbs?: string[] }) => {
  const { t } = useTranslation('public');
  const all = verbs?.includes('*');
  const actions: ReactNode = all ? (
    <div className="rbac-rule-row">{t('All')}</div>
  ) : (
    verbs?.map((a) => (
      <div className="rbac-rule-row" key={a}>
        {a}
      </div>
    ))
  );
  return <div>{actions}</div>;
};

const Groups = ({ apiGroups }: { apiGroups?: string[] }) => {
  const { t } = useTranslation('public');
  const all = apiGroups?.includes('*');
  const groups: ReactNode = all ? (
    <div className="rbac-rule-row">
      * <i>{t('All')}</i>
    </div>
  ) : (
    apiGroups?.map((g) => (
      <div className="rbac-rule-row" key={g}>
        {g}
      </div>
    ))
  );
  return <div>{groups}</div>;
};

const Resources = connect(({ k8s }: RootState) => ({
  allModels: Object.values(k8s.RESOURCES?.models ?? {}),
}))(({
  resources,
  nonResourceURLs,
  allModels,
}: {
  resources?: string[];
  nonResourceURLs?: string[];
  allModels: K8sModel[];
}) => {
  const { t } = useTranslation('public');

  let allResources: ReactNode[] = [];
  if (resources) {
    _.each([...new Set(resources)].sort(), (r) => {
      if (r === '') {
        return false;
      }
      if (r === '*') {
        allResources = [
          <span key={r} className="rbac-rule-resource rbac-rule-row">
            {t('All Resources')}
          </span>,
        ];
        return false;
      }
      const base = r.split('/')[0];
      const kind = allModels.find((model) => model.plural === base);

      allResources.push(
        <span key={r} className="rbac-rule-resource rbac-rule-row">
          <ResourceIcon kind={kind ? kind.kind : r} />{' '}
          <span className="rbac-rule-resource__label">{r}</span>
        </span>,
      );
    });
  }

  if (nonResourceURLs && nonResourceURLs.length) {
    if (allResources.length) {
      allResources.push(<Divider key="hr" className="co-divider resource-separator" />);
    }
    let URLs: ReactNode[] = [];
    _.each([...nonResourceURLs].sort(), (r) => {
      if (r === '*') {
        URLs = [
          <div className="rbac-rule-row" key={r}>
            {t('All Non-resource URLs')}
          </div>,
        ];
        return false;
      }
      URLs.push(
        <div className="rbac-rule-row" key={r}>
          {r}
        </div>,
      );
    });
    allResources.push(...URLs);
  }
  return <div className="rbac-rule-resources">{allResources}</div>;
});

const ResourceNames = ({ resourceNames }: { resourceNames?: string[] }) => {
  if (!resourceNames || resourceNames.length === 0) {
    return null;
  }

  const names = [...resourceNames].sort().map((name) => (
    <div className="rbac-rule-row" key={name}>
      {name}
    </div>
  ));

  return <div>{names}</div>;
};

// This page is temporarily disabled until we update the safe resources list.
// const EditRule = (name, namespace, i) => ({
//   label: 'Edit Rule',
//   href: namespace ? `/k8s/ns/${namespace}/roles/${name}/${i}/edit` : `/k8s/cluster/clusterroles/${name}/${i}/edit`,
// });

const RuleKebab = ({ name, namespace, i }: { name: string; namespace?: string; i: number }) => {
  const { t } = useTranslation('public');
  const openDeleteRuleConfirm = useWarningModal({
    title: t('Delete rule'),
    children: t('Are you sure you want to delete rule #{{ruleNumber}}?', {
      ruleNumber: i,
    }),
    confirmButtonLabel: t('Delete rule'),
    confirmButtonVariant: ButtonVariant.danger,
    onConfirm: () => {
      const kind: K8sModel = namespace ? RoleModel : ClusterRoleModel;
      return k8sPatch(kind, { metadata: { name, namespace } }, [
        {
          op: 'remove',
          path: `/rules/${i}`,
        },
      ]);
    },
    ouiaId: 'RBACDeleteRuleConfirmation',
  });

  const options = [
    // EditRule,
    () => ({
      label: t('Delete rule'),
      callback: () => openDeleteRuleConfirm(),
    }),
  ].map((f) => f());
  return <Kebab options={options} />;
};

const Rule = ({
  resources,
  nonResourceURLs,
  verbs,
  apiGroups,
  resourceNames,
  name,
  namespace,
  i,
}: RoleRule & { name: string; namespace?: string; i: number }) => (
  <>
    <Td>
      <Actions verbs={verbs} />
    </Td>
    <Td visibility={['hidden', 'visibleOnSm']}>
      <Groups apiGroups={apiGroups} />
    </Td>
    <Td>
      <Resources resources={resources} nonResourceURLs={nonResourceURLs} />
    </Td>
    <Td>
      <ResourceNames resourceNames={resourceNames} />
    </Td>
    <Td className="pf-v6-c-table__action">
      <RuleKebab name={name} namespace={namespace} i={i} />
    </Td>
  </>
);
