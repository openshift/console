import React from 'react';

import {register, angulars} from '../react-wrapper';
import {Dropdown} from '../utils';

export const makeListPage = (name, kindName, ListComponent, dropdownFilters) => {
  class ListPage extends React.Component {
    get list () {
      return this.refs.list;
    }

    onFilterChange (event) {
      this.list.applyFilter('name', event.target.value);
    };

    onDropdownChange (type, items, status) {
      this.list.applyFilter(type, items[status]);
    };

    render () {
      const {namespace, defaultNS, canCreate} = this.props;

      const kind = angulars.kinds[kindName];
      const href = `ns/${namespace || defaultNS}/${kind.plural}/new`;

      return (
        <div className="co-m-pane">
          <div className="co-m-pane__heading">
            <div className="row">
              <div className="col-xs-12">
                { canCreate &&
                  <a href={href} className="co-m-primary-action pull-left">
                    <button className="btn btn-primary">
                      Create {kind.label}
                    </button>
                  </a>
                }
                <input type="text" className="form-control text-filter pull-right" placeholder={`Filter ${kind.labelPlural} by name...`} onChange={this.onFilterChange.bind(this)} autoFocus={true} />
                {
                  dropdownFilters && dropdownFilters.map(({type, items, title}) => {
                    return <Dropdown key={title} className="pull-right" items={items} title={title} onChange={this.onDropdownChange.bind(this, type, items)} />
                  })
                }
              </div>
            </div>
          </div>
          <div className="co-m-pane__body">
            <div className="row">
              <div className="col-xs-12">
                <ListComponent ref="list" {...this.props} />
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
    selectorRequired: React.PropTypes.bool,
  };

  register(name, ListPage);
  return ListPage;
};
