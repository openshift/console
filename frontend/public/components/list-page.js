import React from 'react';
import {register} from './react-wrapper';
import {PodList} from './pods';
import Dropdown from './dropdown';

const ITEMS = {
  'All Statuses': '',
  'Pending': 'Pending',
  'Running': 'Running',
  'Terminating': 'Terminating'
};

class ListPage extends React.Component {

  get podList () {
    return this.refs.podlist;
  }

  onFilterChange (event) {
    this.podList.applyFilter('name', event.target.value);
  };

  onStatusChange (phase) {
    phase = ITEMS[phase];
    this.podList.applyFilter('podStatus', phase);
  };

  render () {
    const {namespace, defaultNS, canCreate, selector, fieldSelector} = this.props;
    const href = `/ns/${namespace || defaultNS}/pods/new`;

    return (
      <div className="co-m-pane">
        <div className="co-m-pane__heading">
          <div className="row">
            <div className="col-xs-12">
              { !canCreate ? '' :
                <a href={href} className="co-m-primary-action pull-left">
                  <button className="btn btn-primary">
                    Create Pod
                  </button>
                </a>
              }
              <input type="text" className="form-control text-filter pull-right" placeholder="Filter pods by name..." onChange={this.onFilterChange.bind(this)} autoFocus={true} />
              <Dropdown className="pull-right" items={ITEMS} title="Pod Status" onChange={this.onStatusChange.bind(this)} />
            </div>
          </div>
        </div>
        <div className="co-m-pane__body">
          <div className="row">
            <div className="col-xs-12">
              <PodList ref="podlist" namespace={namespace} selector={selector} fieldSelector={fieldSelector} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
ListPage.propTypes = {
  namespace: React.PropTypes.string,
  defaultNS: React.PropTypes.string,
  canCreate: React.PropTypes.bool,
  selector: React.PropTypes.object,
  fieldSelector: React.PropTypes.string,
};

register('ListPage', ListPage);
