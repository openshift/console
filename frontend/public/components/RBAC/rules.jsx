/* eslint-disable @typescript-eslint/no-use-before-define */
import * as _ from 'lodash';
import { connect } from 'react-redux';

import { Divider, ButtonVariant } from '@patternfly/react-core';
import { k8sPatch } from '../../module/k8s';
import { RoleModel, ClusterRoleModel } from '../../models';
import { Kebab } from '../utils/kebab';
import { EmptyBox } from '../utils/status-box';
import { ResourceIcon } from '../utils/resource-icon';

import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { useTranslation } from 'react-i18next';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

export const RulesList = ({ rules, name, namespace }) => {
  const { t } = useTranslation();
  return _.isEmpty(rules) ? (
    <EmptyBox label={t('public~Rules')} />
  ) : (
    <Table gridBreakPoint="">
      <Thead>
        <Tr>
          <Th>{t('public~Verbs')}</Th>
          <Th visibility={['hidden', 'visibleOnSm']}>{t('public~API groups')}</Th>
          <Th>{t('public~Resources')}</Th>
          <Th>{t('public~Resource names')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rules.map((rule, i) => (
          <Tr key={i}>
            <Rule {...rule} name={name} namespace={namespace} i={i} />
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

const Actions = ({ verbs }) => {
  let actions = [];
  _.each(verbs, (a) => {
    if (a === '*') {
      actions = <div className="rbac-rule-row">All</div>;
      return false;
    }
    actions.push(
      <div className="rbac-rule-row" key={a}>
        {a}
      </div>,
    );
  });
  return <div>{actions}</div>;
};

const Groups = ({ apiGroups }) => {
  // defaults to [""]
  let groups = [];
  _.each(apiGroups, (g) => {
    if (g === '*') {
      groups = (
        <div className="rbac-rule-row">
          * <i>All</i>
        </div>
      );
      return false;
    }
    groups.push(
      <div className="rbac-rule-row" key={g}>
        {g}
      </div>,
    );
  });
  return <div>{groups}</div>;
};

const Resources = connect(({ k8s }) => ({ allModels: k8s.getIn(['RESOURCES', 'models']) }))(
  ({ resources, nonResourceURLs, allModels }) => {
    let allResources = [];
    resources &&
      _.each([...new Set(resources)].sort(), (r) => {
        if (r === '') {
          return false;
        }
        if (r === '*') {
          allResources = [
            <span key={r} className="rbac-rule-resource rbac-rule-row">
              All Resources
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

    if (nonResourceURLs && nonResourceURLs.length) {
      if (allResources.length) {
        allResources.push(<Divider key="hr" className="co-divider resource-separator" />);
      }
      let URLs = [];
      _.each(nonResourceURLs.sort(), (r) => {
        if (r === '*') {
          URLs = [
            <div className="rbac-rule-row" key={r}>
              All Non-resource URLs
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
      allResources.push.apply(allResources, URLs);
    }
    return <div className="rbac-rule-resources">{allResources}</div>;
  },
);

const ResourceNames = ({ resourceNames }) => {
  if (!resourceNames || resourceNames.length === 0) {
    return null;
  }

  const names = resourceNames.toSorted().map((name) => (
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

const RuleKebab = ({ name, namespace, i }) => {
  const { t } = useTranslation();
  const openDeleteRuleConfirm = useWarningModal({
    title: t('public~Delete rule'),
    children: t('public~Are you sure you want to delete rule #{{ruleNumber}}?', {
      ruleNumber: i,
    }),
    confirmButtonLabel: t('public~Delete rule'),
    confirmButtonVariant: ButtonVariant.danger,
    onConfirm: () => {
      const kind = namespace ? RoleModel : ClusterRoleModel;
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
      label: t('public~Delete rule'),
      callback: () => openDeleteRuleConfirm(),
    }),
  ].map((f) => f(name, namespace, i));
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
}) => (
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
