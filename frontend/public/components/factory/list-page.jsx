import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as classNames from'classnames';
import * as PropTypes from 'prop-types';

import k8sActions from '../../module/k8s/k8s-actions';
import { CheckBoxes } from '../row-filter';
import { Dropdown, Firehose, kindObj, MultiFirehose, NavTitle, history } from '../utils';

export const CompactExpandButtons = ({expand = false, onExpandChange = _.noop}) => <div className="btn-group btn-group-sm pull-left" data-toggle="buttons">
  <label className={classNames('btn compaction-btn', expand ? 'btn-unselected' : 'btn-selected')}>
    <input type="radio" onClick={() => onExpandChange(false)} /> Compact
  </label>
  <label className={classNames('btn compaction-btn', expand ? 'btn-selected' : 'btn-unselected')}>
    <input type="radio" onClick={() => onExpandChange(true)} /> Expand
  </label>
</div>;

/** @type {React.StatelessComponent<{label: string, onChange: React.ChangeEventHandler<any>, defaultValue: string}}>} */
export const TextFilter = ({label, onChange, defaultValue}) => <input
  type="text"
  className="form-control text-filter pull-right"
  placeholder={`Filter ${label}...`}
  onChange={onChange}
  autoFocus={true}
  defaultValue={defaultValue}
/>;

TextFilter.displayName = 'TextFilter';

export const BaseListPage = connect(null, {filterList: k8sActions.filterList})(
  /** @augments {React.PureComponent<{ListComponent: React.ComponentType<any>, kind: string, filterLabel: string, title: string, showTitle: boolean, dropdownFilters?: any[]}>} */
  class BaseListPage_ extends React.PureComponent {
    constructor (props) {
      super(props);
      this.state = {expand: !!props.expand};
      this.onExpandChange = this.onExpandChange.bind(this);
      this.applyFilter = this.applyFilter.bind(this);
    }

    onExpandChange (expand) {
      this.setState({expand});
    }

    updateURL (filterName, options) {
      if (filterName !== this.props.textFilter) {
        // TODO (ggreer): support complex filters (objects, not just strings)
        return;
      }
      const params = new URLSearchParams(window.location.search);
      if (options) {
        params.set(filterName, options);
      } else {
        params.delete(filterName);
      }
      const url = new URL(window.location);
      history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
    }

    applyFilter (filterName, options) {
      const reduxIDs = this.props.reduxIDs || [this.props.reduxID];
      reduxIDs.forEach(id => this.props.filterList(id, filterName, options));
      this.updateURL(filterName, options);
    }

    componentWillMount () {
      const params = new URLSearchParams(window.location.search);
      this.defaultValue = params.get(this.props.textFilter);
      params.forEach((v, k) => this.applyFilter(k, v));
    }

    render () {
      const {data, kinds, ListComponent, createButtonText, dropdownFilters, rowFilters, textFilter, filterLabel, title, canExpand, canCreate, createProps, Intro, loaded, loadError} = this.props;
      const resources = _.pick(this.props, kinds);

      const DropdownFilters = dropdownFilters && dropdownFilters.map(({type, items, title}) => {
        return <Dropdown key={title} className="pull-right" items={items} title={title} onChange={v => this.applyFilter(type, v)} />;
      });

      const RowsOfRowFilters = rowFilters && _.map(rowFilters, ({items, reducer, selected, type, numbers}, i) => {
        const count = _.isFunction(numbers) ? numbers(data) : undefined;
        return <CheckBoxes
          key={i}
          applyFilter={this.applyFilter}
          items={_.isFunction(items) ? items(resources) : items}
          numbers={count || _.countBy(data, reducer)}
          selected={selected}
          type={type}
        />;
      });

      let createLink;
      if (loaded && _.isEmpty(loadError) && canCreate) {
        if (createProps.to) {
          createLink = <Link className="co-m-primary-action pull-left" {...createProps}>
            <button className="btn btn-primary" id="yaml-create">{createButtonText}</button>
          </Link>;
        } else {
          createLink = <button className="btn btn-primary" id="yaml-create" {...createProps}>{createButtonText}</button>;
        }
      }

      return <div>
        {title && <NavTitle title={title} />}
        <div className="co-m-pane">
          <div className="co-m-pane__heading">
            <div className="row">
              <div className="col-xs-12">
                {Intro}
                {createLink}
                {canExpand && <CompactExpandButtons expand={this.state.expand} onExpandChange={this.onExpandChange} />}
                <TextFilter label={filterLabel} onChange={e => this.applyFilter(textFilter, e.target.value)} defaultValue={this.defaultValue} />
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

BaseListPage.defaultProps = {
  textFilter: 'name',
};

BaseListPage.propTypes = {
  canCreate: PropTypes.bool,
  canExpand: PropTypes.bool,
  createProps: PropTypes.object,
  data: PropTypes.array,
  dropdownFilters: PropTypes.array,
  fieldSelector: PropTypes.string,
  filterLabel: PropTypes.string,
  Intro: PropTypes.element,
  kinds: PropTypes.array.isRequired,
  ListComponent: PropTypes.func.isRequired,
  rowFilters: PropTypes.array,
  selector: PropTypes.object,
  textFilter: PropTypes.string,
  title: PropTypes.string,
};

/** @type {React.StatelessComponent<{ListComponent: React.ComponentType<any>, kind: string, filterLabel: string, title?: string, showTitle?: boolean, dropdownFilters?: any[]}>} */
export const ListPage = props => {
  const {createHandler, filterLabel, kind, namespace, showTitle = true} = props;
  const {label, labelPlural, plural} = kindObj(kind);
  const title = props.title || labelPlural;

  const href = `/ns/${namespace || 'default'}/${plural}/new`;
  const createProps = createHandler ? {onClick: createHandler} : {to: href};

  return <Firehose key={`${namespace}-${kind}`} {...props} isList={true}>
    <BaseListPage
      {...props}
      createButtonText={`Create ${label}`}
      createProps={createProps}
      filterLabel={filterLabel || `${labelPlural} by name`}
      kinds={[kind]}
      title={showTitle ? title : undefined}
    />
  </Firehose>;
};
ListPage.displayName = 'ListPage';

// FIXME(alecmerdler): Fix this typing
/** @type {React.StatelessComponent<any>} */
export const MultiListPage = connect(({UI}) => ({ns: UI.get('activeNamespace')}))(
  /** @type {React.StatelessComponent<{canCreate?: boolean, createButtonText?: string, ns: string, resources: any[], ListComponent: React.ComponentType<any>}>, flatten?: function} */
  props => {
    const {createButtonText, ns, resources, flatten} = props;
    const firehoseResources = resources.map(r => ({
      kind: r.kind,
      isList: true,
      namespace: r.namespaced ? ns : undefined,
      prop: r.kind,
    }));

    return <MultiFirehose resources={firehoseResources} flatten={flatten}>
      <BaseListPage
        {...props}
        createButtonText={createButtonText || 'Create'}
        kinds={_.map(resources, 'kind')}
      />
    </MultiFirehose>;
  });
