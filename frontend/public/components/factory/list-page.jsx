import React from 'react';
import classNames from 'classnames';

import {register, angulars} from '../react-wrapper';
import {Dropdown} from '../utils';
import {RowFilter} from '../row-filter';

const CompactExpandButtons = ({expand = false, onExpandChange = _.noop}) => <div className="btn-group btn-group-sm pull-left" data-toggle="buttons">
  <label className={classNames('btn compaction-btn', expand ? 'btn-unselected' : 'btn-selected')}>
    <input type="radio" onClick={() => onExpandChange(false)} /> Compact
  </label>
  <label className={classNames('btn compaction-btn', expand ? 'btn-selected' : 'btn-unselected')}>
    <input type="radio" onClick={() => onExpandChange(true)} /> Expand
  </label>
</div>

export const makeListPage = (name, kindName, ListComponent, dropdownFilters, rowFilters, filterLabel) => {
  class ListPage extends React.Component {
    constructor (props) {
      super(props);
      this.state = {expand: !!props.expand};
    }

    get list () {
      return this.refs.list;
    }

    onFilterChange (event) {
      this.list.applyFilter('name', event.target.value);
    };

    onDropdownChange (type, status) {
      this.list.applyFilter(type, status);
    };

    render () {
      const {namespace, defaultNS, canCreate, canExpand = false} = this.props;

      const kind = angulars.kinds[kindName];
      const href = `ns/${namespace || defaultNS}/${kind.plural}/new`;

      const DropdownFilters = dropdownFilters && dropdownFilters.map(({type, items, title}) => {
        return <Dropdown key={title} className="pull-right" items={items} title={title} onChange={this.onDropdownChange.bind(this, type)} />
      });

      const RowsOfRowFilters = rowFilters && _.map(rowFilters, (rowFilter, i) => {
        return <RowFilter key={i} rowFilter={rowFilter} {...this.props} />;
      });

      const onExpandChange = (expand) => { this.setState({expand}); };

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
                {canExpand && <CompactExpandButtons expand={this.state.expand} onExpandChange={onExpandChange} />}
                <input type="text" className="form-control text-filter pull-right" placeholder={`Filter ${filterLabel || kind.labelPlural} by name...`} onChange={this.onFilterChange.bind(this)} autoFocus={true} />
                {DropdownFilters}
              </div>
              {RowsOfRowFilters}
            </div>
          </div>
          <div className="co-m-pane__body">
            <div className="row">
              <div className="col-xs-12">
                <ListComponent ref="list" {...this.props} expand={this.state.expand} />
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
