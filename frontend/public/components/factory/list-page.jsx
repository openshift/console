import React from 'react';
import {connect} from 'react-redux';
import { Link } from 'react-router';
import classNames from 'classnames';

import {k8sEnum} from '../../module/k8s';
import actions from '../../module/k8s/k8s-actions';
import {CheckBoxes} from '../row-filter';
import {Dropdown, Firehose, kindObj, MultiFirehose, NavTitle} from '../utils';

const CompactExpandButtons = ({expand = false, onExpandChange = _.noop}) => <div className="btn-group btn-group-sm pull-left" data-toggle="buttons">
  <label className={classNames('btn compaction-btn', expand ? 'btn-unselected' : 'btn-selected')}>
    <input type="radio" onClick={() => onExpandChange(false)} /> Compact
  </label>
  <label className={classNames('btn compaction-btn', expand ? 'btn-selected' : 'btn-unselected')}>
    <input type="radio" onClick={() => onExpandChange(true)} /> Expand
  </label>
</div>;

export const TextFilter = ({label, onChange}) => <input
  type="text"
  className="form-control text-filter pull-right"
  placeholder={`Filter ${label}...`}
  onChange={onChange}
  autoFocus={true}
/>;

const BaseListPage = connect(null, {filterList: actions.filterList})(
class BaseListPage_ extends React.Component {
  constructor (props) {
    super(props);
    this.state = {expand: !!props.expand};
    this.onExpandChange = this.onExpandChange.bind(this);
    this.applyFilter = this.applyFilter.bind(this);
  }

  onExpandChange (expand) {
    this.setState({expand});
  }

  applyFilter (filterName, options) {
    const reduxIDs = this.props.reduxIDs || [this.props.reduxID];
    reduxIDs.forEach(id => this.props.filterList(id, filterName, options));
  }

  render () {
    const {kinds, ListComponent, createButtonText, dropdownFilters, rowFilters, rowSplitter, textFilter, filterLabel, title, canExpand, canCreate, createProps, Intro} = this.props;
    const resources = _.pick(this.props, kinds);

    // List data will either be in a single "data" property, or under multiple props if we have multiple resource kinds
    const data = this.props.data || _.flatMap(_.flatMap(resources, 'data'), rowSplitter);

    const DropdownFilters = dropdownFilters && dropdownFilters.map(({type, items, title}) => {
      return <Dropdown key={title} className="pull-right" items={items} title={title} onChange={v => this.applyFilter(type, v)} />;
    });

    const RowsOfRowFilters = rowFilters && _.map(rowFilters, ({items, reducer, selected, type}, i) => <CheckBoxes
      key={i}
      applyFilter={this.applyFilter}
      items={_.isFunction(items) ? items(resources) : items}
      numbers={_.countBy(data, reducer)}
      selected={selected}
      type={type}
    />);

    return <div>
      {title && <NavTitle title={title} />}
      <div className="co-m-pane">
        <div className="co-m-pane__heading">
          <div className="row">
            <div className="col-xs-12">
              {Intro}
              {canCreate && <Link className="co-m-primary-action pull-left" {...createProps}>
                <button className="btn btn-primary">{createButtonText}</button>
              </Link>}
              {canExpand && <CompactExpandButtons expand={this.state.expand} onExpandChange={this.onExpandChange} />}
              <TextFilter label={filterLabel} onChange={e => this.applyFilter(textFilter || 'name', e.target.value)} />
              {DropdownFilters}
            </div>
            {RowsOfRowFilters}
          </div>
        </div>
        <div className="co-m-pane__body">
          <div className="row">
            <div className="col-xs-12">
              <ListComponent {...this.props} expand={this.state.expand} />
            </div>
          </div>
        </div>
      </div>
    </div>;
  }
});

BaseListPage.propTypes = {
  canCreate: React.PropTypes.bool,
  canExpand: React.PropTypes.bool,
  createProps: React.PropTypes.object,
  data: React.PropTypes.array,
  dropdownFilters: React.PropTypes.array,
  fieldSelector: React.PropTypes.string,
  filterLabel: React.PropTypes.string,
  Intro: React.PropTypes.element,
  kinds: React.PropTypes.array.isRequired,
  ListComponent: React.PropTypes.func.isRequired,
  rowFilters: React.PropTypes.array,
  rowSplitter: React.PropTypes.func,
  selector: React.PropTypes.object,
  textFilter: React.PropTypes.string,
  title: React.PropTypes.string,
};

export const ListPage = props => {
  const {createHandler, filterLabel, kind, namespace, showTitle = true} = props;
  const {label, labelPlural, plural} = kindObj(kind);

  const href = `ns/${namespace || k8sEnum.DefaultNS}/${plural}/new`;
  const createProps = createHandler ? {onClick: createHandler} : {to: href};

  return <Firehose key={`${namespace}-${kind}`} {...props} isList={true}>
    <BaseListPage
      {...props}
      createButtonText={`Create ${label}`}
      createProps={createProps}
      filterLabel={filterLabel || `${labelPlural} by name`}
      kinds={[kind]}
      title={showTitle ? labelPlural : undefined}
    />
  </Firehose>;
};

export const MultiListPage = connect(({UI}) => ({ns: UI.get('activeNamespace'), path: UI.get('location')}))(
props => {
  const {createButtonText, ns, path, resources} = props;
  const firehoseResources = resources.map(r => ({
    kind: r.kind,
    isList: true,
    namespace: r.namespaced ? ns : undefined,
    prop: r.kind,
  }));
  return <MultiFirehose key={path} resources={firehoseResources}>
    <BaseListPage
      {...props}
      createButtonText={createButtonText || 'Create'}
      kinds={_.map(resources, 'kind')}
    />
  </MultiFirehose>;
});
