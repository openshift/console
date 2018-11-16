import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Helmet } from 'react-helmet';

import { AsyncComponent } from './utils/async';
import { connectToModel } from '../kinds';
import { DefaultPage } from './default-resource';
import { namespaceProptype } from '../propTypes';
import { requirementFromString } from '../module/k8s/selector-requirement';
import { ResourceListDropdown } from './resource-dropdown';
import { resourceListPages } from './resource-pages';
import { withStartGuide } from './start-guide';
import { split, selectorFromString } from '../module/k8s/selector';
import { referenceForModel, kindForReference } from '../module/k8s';
import {
  history,
  LoadingBox,
  PageHeading,
  SelectorInput,
} from './utils';

const ResourceList = connectToModel(({kindObj, kindsInFlight, mock, namespace, selector}) => {
  if (!kindObj && kindsInFlight) {
    return <LoadingBox />;
  }

  const componentLoader = resourceListPages.get(referenceForModel(kindObj), () => Promise.resolve(DefaultPage));
  const ns = kindObj.namespaced ? namespace : undefined;

  return <AsyncComponent loader={componentLoader} namespace={ns} selector={selector} kind={kindObj.crd ? referenceForModel(kindObj) : kindObj.kind} showTitle={false} autoFocus={false} mock={mock} />;
});

const updateUrlParams = (k, v) => {
  const url = new URL(window.location);
  const sp = new URLSearchParams(window.location.search);
  sp.set(k, v);
  history.push(`${url.pathname}?${sp.toString()}${url.hash}`);
};

const updateKind = kind => updateUrlParams('kind', encodeURIComponent(kind));
const updateTags = tags => updateUrlParams('q', tags.map(encodeURIComponent).join(','));

class SearchPage_ extends React.PureComponent {
  constructor(props) {
    super(props);
    this.setRef = ref => this.ref = ref;
    this.onSelectorChange = k => {
      updateKind(k);
      this.ref && this.ref.focus();
    };
  }

  render() {
    const {location, namespace, noProjectsAvailable} = this.props;
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
    const labelClassName = `co-text-${_.toLower(kindForReference(kind))}`;

    return <React.Fragment>
      <Helmet>
        <title>Search</title>
      </Helmet>
      <PageHeading detail={true} title="Search" >
        <div className="co-search">
          <div className="input-group input-group-select">
            <div className="input-group-btn">
              <ResourceListDropdown selected={kind} onChange={this.onSelectorChange} />
            </div>
            <SelectorInput labelClassName={labelClassName} tags={validTags} onChange={updateTags} ref={this.setRef} autoFocus={!noProjectsAvailable} />
          </div>
        </div>
      </PageHeading>
      <ResourceList kind={kind} selector={selector} namespace={namespace} mock={noProjectsAvailable} />
    </React.Fragment>;
  }
}

export const SearchPage = withStartGuide(SearchPage_);

SearchPage.propTypes = {
  location: PropTypes.object.isRequired,
  namespace: namespaceProptype,
  noProjectsAvailable: PropTypes.bool,
};
