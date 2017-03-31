import React from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';

import {k8sEnum} from '../../module/k8s';
import {RowFilter} from '../row-filter';
import {Dropdown, kindObj, NavTitle} from '../utils';

const CompactExpandButtons = ({expand = false, onExpandChange = _.noop}) => <div className="btn-group btn-group-sm pull-left" data-toggle="buttons">
  <label className={classNames('btn compaction-btn', expand ? 'btn-unselected' : 'btn-selected')}>
    <input type="radio" onClick={() => onExpandChange(false)} /> Compact
  </label>
  <label className={classNames('btn compaction-btn', expand ? 'btn-selected' : 'btn-unselected')}>
    <input type="radio" onClick={() => onExpandChange(true)} /> Expand
  </label>
</div>;

export class ListPage extends React.Component {
  constructor (props) {
    super(props);
    this.state = {expand: !!props.expand};
  }

  get list () {
    return this.refs.list;
  }

  onFilterChange (event) {
    this.list.applyFilter('name', event.target.value);
  }

  onDropdownChange (type, status) {
    this.list.applyFilter(type, status);
  }

  render () {
    const {kind, namespace, ListComponent, dropdownFilters, rowFilters, filterLabel, showTitle = true, canExpand = false, canCreate, createHandler} = this.props;
    const {label, labelPlural, plural} = kindObj(kind);

    const href = `ns/${namespace || k8sEnum.DefaultNS}/${plural}/new`;
    const createProps = createHandler ? {onClick: createHandler} : {to: href};

    const DropdownFilters = dropdownFilters && dropdownFilters.map(({type, items, title}) => {
      return <Dropdown key={title} className="pull-right" items={items} title={title} onChange={this.onDropdownChange.bind(this, type)} />;
    });

    const RowsOfRowFilters = rowFilters && _.map(rowFilters, (rowFilter, i) => {
      return <RowFilter key={i} rowFilter={rowFilter} {...this.props} />;
    });

    const onExpandChange = expand => this.setState({expand});

    return <div>
      {showTitle && <NavTitle title={labelPlural} />}
      <div className="co-m-pane">
        <div className="co-m-pane__heading">
          <div className="row">
            <div className="col-xs-12">
              { canCreate &&
                <Link className="co-m-primary-action pull-left" {...createProps}>
                  <button className="btn btn-primary">
                    Create {label}
                  </button>
                </Link>
              }
              {canExpand && <CompactExpandButtons expand={this.state.expand} onExpandChange={onExpandChange} />}
              <input type="text" className="form-control text-filter pull-right" placeholder={`Filter ${filterLabel || labelPlural} by name...`} onChange={this.onFilterChange.bind(this)} autoFocus={true} />
              {DropdownFilters}
            </div>
            {RowsOfRowFilters}
          </div>
        </div>
        <div className="co-m-pane__body">
          <div className="row">
            <div className="col-xs-12">
              <ListComponent key={`${namespace}-${kind}`} ref="list" {...this.props} expand={this.state.expand} />
            </div>
          </div>
        </div>
      </div>
    </div>;
  }
}

ListPage.propTypes = {
  canCreate: React.PropTypes.bool,
  canExpand: React.PropTypes.bool,
  dropdownFilters: React.PropTypes.array,
  fieldSelector: React.PropTypes.string,
  filterLabel: React.PropTypes.string,
  kind: React.PropTypes.string,
  ListComponent: React.PropTypes.func,
  namespace: React.PropTypes.string,
  rowFilters: React.PropTypes.array,
  selector: React.PropTypes.object,
  showTitle: React.PropTypes.bool,
};
