import * as _ from 'lodash-es';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Helmet } from 'react-helmet';
import * as PropTypes from 'prop-types';
import * as classNames from 'classnames';

import { history, NavTitle, SelectorInput, LoadingBox } from './utils';

import { namespaceProptype } from '../propTypes';
import { split, selectorFromString } from '../module/k8s/selector';
import { requirementFromString } from '../module/k8s/selector-requirement';
import { resourceListPages } from './resource-pages';
import { ResourceListDropdown } from './resource-dropdown';
import { connectToModel } from '../kinds';
import { connectToFlags, FLAGS, flagPending } from '../features';
import { OpenShiftGettingStarted } from './start-guide';

const ResourceList = connectToModel(({kind, kindObj, kindsInFlight, namespace, selector, fake}) => {
  if (kindsInFlight) {
    return <LoadingBox />;
  }

  kindObj = kindObj || {labelPlural: 'Default'};
  const name = kindObj.labelPlural.replace(/ /g, '');
  const ListPage = resourceListPages.get(name) || resourceListPages.get('Default');
  const ns = kindObj.namespaced ? namespace : undefined;

  return <ListPage namespace={ns} selector={selector} kind={kind} showTitle={false} autoFocus={false} fake={fake} />;
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
    const {flags, location, namespace} = this.props;
    let kind, q;

    if (flagPending(flags.OPENSHIFT) || flagPending(flags.PROJECTS_AVAILABLE)) {
      return null;
    }

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
    const showGettingStarted = flags.OPENSHIFT && !flags.PROJECTS_AVAILABLE;

    return <React.Fragment>
      { showGettingStarted && <OpenShiftGettingStarted /> }
      <div className={classNames({'co-disabled': showGettingStarted})}>
        <Helmet>
          <title>Search</title>
        </Helmet>
        <NavTitle detail={true} title="Search" >
          <div style={{paddingBottom: 30}}>
            <div className="input-group">
              <div className="input-group-btn">
                <ResourceListDropdown selected={kind} onChange={this.onSelectorChange} />
              </div>
              <SelectorInput labelClassName={labelClassName} tags={validTags} onChange={updateTags} ref={this.setRef} autoFocus={!showGettingStarted} />
            </div>
          </div>
        </NavTitle>
        <ResourceList kind={kind} selector={selector} namespace={namespace} fake={showGettingStarted} />
      </div>
    </React.Fragment>;
  }
}

export const SearchPage = connectToFlags(FLAGS.OPENSHIFT, FLAGS.PROJECTS_AVAILABLE)(SearchPage_);

SearchPage.propTypes = {
  namespace: namespaceProptype,
  location: PropTypes.object.isRequired,
};
