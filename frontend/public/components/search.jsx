import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as ReactDOM from 'react-dom';
import { Helmet } from 'react-helmet';
import * as PropTypes from 'prop-types';

import { Dropdown, history, NavTitle, ResourceIcon, SelectorInput, LoadingBox } from './utils';

import { namespaceProptype } from '../propTypes';
import { allModels } from '../module/k8s';
import { split, selectorFromString } from '../module/k8s/selector';
import { requirementFromString } from '../module/k8s/selector-requirement';
import { resourceListPages } from './resource-pages';
import { kindReducerName } from '../kinds';
import { ClusterServiceVersionModel, EtcdClusterModel, PrometheusModel, ServiceMonitorModel, AlertmanagerModel } from '../models';

const DropdownItem = ({kind}) => {
  const [modelRef, kindObj] = allModels().findEntry((v) => v.kind === kind);
  return <span>
    <div className="co-type-selector__icon-wrapper">
      <ResourceIcon kind={modelRef} />
    </div>
    {kindObj.labelPlural}
  </span>;
};

const ResourceListDropdown = connect(state => ({ allkinds: state[kindReducerName].get('kinds').toJSON()}))(
  function ResourceListDropdown ({selected, onChange, allkinds}) {
    const items = {};
    const kinds = {};
    _.each(allModels().toJS(), ko => kinds[ko.labelPlural.replace(/ /g, '')] = ko.kind);

    Array.from(resourceListPages.keys())
      .filter(k => k !== ClusterServiceVersionModel.labelPlural)
      .sort()
      .forEach(k => {
        const kind = kinds[k];
        if (!kind) {
          return;
        }
        if (allkinds[kind] && allkinds[kind].crd && ![EtcdClusterModel, PrometheusModel, ServiceMonitorModel, AlertmanagerModel].some(m => m.kind === k)) {
          return;
        }
        items[kind] = <DropdownItem kind={kind} />;
      });

    // If user somehow gets to the search page with Kind=(a CRD kind), show something in the dropdown
    if (!items[selected]) {
      items[selected] = <DropdownItem kind={selected} />;
    }

    return <Dropdown className="co-type-selector" items={items} title={items[selected]} onChange={onChange} selectedKey={selected} />;
  });


function ResourceList ({kind, namespace, selector}) {
  const kindObj = allModels().find((v) => v.kind === kind) || {};

  if (!kindObj || !kindObj.labelPlural) {
    return <LoadingBox />;
  }

  const name = kindObj.labelPlural.replace(/ /g, '');
  const ListPage = resourceListPages.get(name) || resourceListPages.get('Default');
  const ns = kindObj.namespaced ? namespace : undefined;

  return <ListPage namespace={ns} selector={selector} kind={kind} showTitle={false} autoFocus={false} />;
}

const updateUrlParams = (k, v) => {
  const url = new URL(window.location);
  const sp = new URLSearchParams(window.location.search);
  sp.set(k, v);
  history.push(`${url.pathname}?${sp.toString()}${url.hash}`);
};

const updateKind = kind => updateUrlParams('kind', encodeURIComponent(kind));
const updateTags = tags => updateUrlParams('q', tags.map(encodeURIComponent).join(','));

export class SearchPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.setRef = ref => this.ref = ref;
    this.onSelectorChange = k => {
      updateKind(k);
      this.ref && this.ref.focus();
    };
  }

  render() {
    const {location, namespace} = this.props;
    let kind, q;
    if (location.search) {
      const sp = new URLSearchParams(window.location.search);
      kind = sp.get('kind');
      q = sp.get('q');
    }

    // Ensure that the "kind" route parameter is a valid resource kind ID
    kind = kind ? decodeURIComponent(kind) : 'Service';

    const tags = split(_.isString(q) ? decodeURIComponent(q) : '');
    const validTags = _.reject(tags, tag => requirementFromString(tag) === undefined);
    const selector = selectorFromString(validTags.join(','));
    const labelClassName = `co-text-${_.toLower(kind)}`;

    return <div className="co-p-search">
      <Helmet>
        <title>Search</title>
      </Helmet>
      <NavTitle detail={true} title="Search" >
        <div style={{padding: 15, paddingTop: 0, paddingBottom: 30}}>
          <div className="input-group">
            <div className="input-group-btn">
              <ResourceListDropdown selected={kind} onChange={this.onSelectorChange} />
            </div>
            <SelectorInput labelClassName={labelClassName} tags={validTags} onChange={updateTags} ref={this.setRef} autoFocus />
          </div>
        </div>
      </NavTitle>
      <ResourceList kind={kind} selector={selector} namespace={namespace} />
    </div>;
  }
}

SearchPage.propTypes = {
  namespace: namespaceProptype,
  location: PropTypes.object.isRequired,
};
