import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';

import { k8sPatch } from '../../module/k8s';
import { RoleModel, ClusterRoleModel } from '../../models';
import { Cog, EmptyBox, ResourceIcon } from '../utils';
import { confirmModal } from '../modals';

export const RulesList = ({rules, name, namespace}) => _.isEmpty(rules)
  ? <EmptyBox label="Rules" />
  : <div className="co-m-table-grid co-m-table-grid--bordered rbac-rules-list">
    <div className="row co-m-table-grid__head">
      <div className="col-xs-5 col-sm-4 col-md-3 col-lg-2">
        Actions
      </div>
      <div className="hidden-xs col-sm-4 col-md-3 col-lg-3">
        API Groups
      </div>
      <div className="col-xs-7 col-sm-4 col-md-6 col-lg-7">
        Resources
      </div>
    </div>
    <div className="co-m-table-grid__body">
      {rules.map((rule, i) => <div className="row co-resource-list__item" key={i}>
        <Rule {...rule} name={name} namespace={namespace} i={i} />
      </div>)}
    </div>
  </div>;

const Actions = ({verbs}) => {
  let actions = [];
  _.each(verbs, a => {
    if (a === '*') {
      actions = <div className="rbac-rule-row">All</div>;
      return false;
    }
    actions.push(<div className="rbac-rule-row" key={a}>{a}</div>);
  });
  return <div>{actions}</div>;
};

const Groups = ({apiGroups}) => {
  // defaults to [""]
  let groups = [];
  _.each(apiGroups, g => {
    if (g === '*') {
      groups = <div className="rbac-rule-row">* <i>All</i></div>;
      return false;
    }
    groups.push(<div className="rbac-rule-row" key={g}>{g}</div>);
  });
  return <div>{groups}</div>;
};

const Resources = connect(({k8s}) => ({allModels: k8s.getIn(['RESOURCES', 'models'])}))(
  ({resources, nonResourceURLs, allModels}) => {
    let allResources = [];
    resources && _.each([...new Set(resources)].sort(), r => {
      if (r === '*') {
        allResources = [<span key={r} className="rbac-rule-resource rbac-rule-row">All Resources</span>];
        return false;
      }
      const base = r.split('/')[0];
      const kind = allModels.find(model => model.plural === base);

      allResources.push(<span key={r} className="rbac-rule-resource rbac-rule-row">
        <ResourceIcon kind={kind ? kind.kind : r} /> <span className="rbac-rule-resource__label">{r}</span>
      </span>);
    });

    if (nonResourceURLs && nonResourceURLs.length) {
      if (allResources.length) {
        allResources.push(<hr key="hr" className="resource-separator" />);
      }
      let URLs = [];
      _.each(nonResourceURLs.sort(), r => {
        if (r === '*') {
          URLs = [<div className="rbac-rule-row" key={r}>All Non-resource URLs</div>];
          return false;
        }
        URLs.push(<div className="rbac-rule-row" key={r}>{r}</div>);
      });
      allResources.push.apply(allResources, URLs);
    }
    return <div className="rbac-rule-resources">{allResources}</div>;
  });

const DeleteRule = (name, namespace, i) => ({
  label: 'Delete Rule...',
  callback: () => confirmModal({
    title: 'Delete Rule',
    message: `Are you sure you want to delete Rule #${i}?`,
    btnText: 'Delete Rule',
    executeFn: () => {
      const kind = namespace ? RoleModel : ClusterRoleModel;
      return k8sPatch(kind, {metadata: {name, namespace}}, [{
        op: 'remove', path: `/rules/${i}`,
      }]);
    },
  })
});

// This page is temporarily disabled until we update the safe resources list.
// const EditRule = (name, namespace, i) => ({
//   label: 'Edit Rule...',
//   href: namespace ? `/k8s/ns/${namespace}/roles/${name}/${i}/edit` : `/k8s/cluster/clusterroles/${name}/${i}/edit`,
// });

const RuleCog = ({name, namespace, i}) => {
  const options = [
    // EditRule,
    DeleteRule,
  ].map(f => f(name, namespace, i));
  return <Cog options={options} />;
};

const Rule = ({resources, nonResourceURLs, verbs, apiGroups, name, namespace, i}) => <div className="rbac-rule">
  <div className="col-xs-5 col-sm-4 col-md-3 col-lg-2 rbac-rule__actions">
    <div className="rbac-rule__cog">
      <RuleCog name={name} namespace={namespace} i={i} />
    </div>
    <Actions verbs={verbs} />
  </div>
  <div className="hidden-xs col-sm-4 col-md-3 col-lg-3">
    <Groups apiGroups={apiGroups} />
  </div>
  <div className="col-xs-7 col-sm-4 col-md-6 col-lg-7">
    <Resources resources={resources} nonResourceURLs={nonResourceURLs} />
  </div>
</div>;
