import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { DragSource, DropTarget } from 'react-dnd';
import { DRAGGABLE_TYPE } from './draggable-item-types';

import { NameValueEditorPair, EnvFromPair, EnvType } from './index';
import { ValueFromPair } from './value-from-pair';
import withDragDropContext from './drag-drop-context';

export const NameValueEditor = withDragDropContext(class NameValueEditor extends React.Component {
  constructor(props) {
    super(props);
    this._append = this._append.bind(this);
    this._appendConfigMapOrSecret = this._appendConfigMapOrSecret.bind(this);
    this._change = this._change.bind(this);
    this._move = this._move.bind(this);
    this._remove = this._remove.bind(this);
  }

  _append() {
    const {updateParentData, nameValuePairs, nameValueId, allowSorting} = this.props;

    updateParentData({nameValuePairs: allowSorting ? nameValuePairs.concat([['', '', nameValuePairs.length]]) : nameValuePairs.concat([['', '']])}, nameValueId);
  }

  _appendConfigMapOrSecret() {
    const {updateParentData, nameValuePairs, nameValueId} = this.props;
    const configMapSecretKeyRef = {name: '', key: ''};
    updateParentData({nameValuePairs: nameValuePairs.concat([['', {configMapSecretKeyRef}, nameValuePairs.length]])}, nameValueId);
  }

  _remove(i) {
    const {updateParentData, nameValueId} = this.props;
    const nameValuePairs = _.cloneDeep(this.props.nameValuePairs);
    nameValuePairs.splice(i, 1);

    updateParentData({nameValuePairs: nameValuePairs.length ? nameValuePairs : [['', '']]}, nameValueId);
  }

  _change(e, i, type) {
    const {updateParentData, nameValueId} = this.props;
    const nameValuePairs = _.cloneDeep(this.props.nameValuePairs);

    nameValuePairs[i][type === NameValueEditorPair.Name ? NameValueEditorPair.Name : NameValueEditorPair.Value] = e.target.value;
    updateParentData({nameValuePairs}, nameValueId);
  }

  _move(dragIndex, hoverIndex) {
    const {updateParentData, nameValueId} = this.props;
    const nameValuePairs = _.cloneDeep(this.props.nameValuePairs);
    const movedPair = nameValuePairs[dragIndex];

    nameValuePairs[dragIndex] = nameValuePairs[hoverIndex];
    nameValuePairs[hoverIndex] = movedPair;
    updateParentData({nameValuePairs}, nameValueId);
  }

  render() {
    const {nameString, valueString, addString, nameValuePairs, allowSorting, readOnly, nameValueId, configMaps, secrets, addConfigMapSecret} = this.props;
    const pairElems = nameValuePairs.map((pair, i) => {
      const key = _.get(pair, [NameValueEditorPair.Index], i);

      return <PairElement onChange={this._change} index={i} nameString={nameString} valueString={valueString} allowSorting={allowSorting} readOnly={readOnly} pair={pair} key={key} onRemove={this._remove} onMove={this._move} rowSourceId={nameValueId} configMaps={configMaps} secrets={secrets} />;
    });
    return <React.Fragment>
      <div className="row">
        {!readOnly && allowSorting && <div className="col-xs-1 co-empty__header"></div>}
        <div className="col-xs-5 text-secondary text-uppercase co-full__header">{nameString}</div>
        <div className="col-xs-5 text-secondary text-uppercase co-full__header">{valueString}</div>
        <div className="col-xs-1 co-empty__header"></div>
      </div>
      {pairElems}
      <div className="row">
        <div className="col-xs-12">
          {
            readOnly ?
              null :
              <div className="co-toolbar__group co-toolbar__group--left">
                <button type="button" className="btn btn-link pairs-list__add-btn" onClick={this._append}>
                  <i aria-hidden="true" className="fa fa-plus-circle pairs-list__add-icon" />{addString}
                </button>
                {
                  addConfigMapSecret &&
                    <React.Fragment>
                      <span aria-hidden="true" className="co-action-divider hidden-xs">|</span>
                      <button type="button" className="btn btn-link" onClick={this._appendConfigMapOrSecret}>
                        <i aria-hidden="true" className="fa fa-plus-circle pairs-list__add-icon" />Add from Config Map or Secret
                      </button>
                    </React.Fragment>
                }
              </div>
          }
        </div>
      </div>
    </React.Fragment>;
  }
});
NameValueEditor.propTypes = {
  nameString: PropTypes.string,
  valueString: PropTypes.string,
  addString: PropTypes.string,
  allowSorting: PropTypes.bool,
  readOnly: PropTypes.bool,
  nameValueId: PropTypes.number,
  nameValuePairs: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
      PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.number])),
    ])
  ).isRequired,
  updateParentData: PropTypes.func.isRequired,
  configMaps: PropTypes.object,
  secrets: PropTypes.object,
  addConfigMapSecret: PropTypes.bool,
};
NameValueEditor.defaultProps = {
  nameString: 'Key',
  valueString: 'Value',
  addString: 'Add More',
  allowSorting: false,
  readOnly: false,
  nameValueId: 0,
  addConfigMapSecret: false,
};

NameValueEditor.displayName = 'Name Value Editor';

export const EnvFromEditor = withDragDropContext(class EnvFromEditor extends React.Component {
  constructor(props) {
    super(props);
    this._append = this._append.bind(this);
    this._change = this._change.bind(this);
    this._move = this._move.bind(this);
    this._remove = this._remove.bind(this);
  }

  _append() {
    const {updateParentData, nameValuePairs, nameValueId} = this.props;
    const configMapSecretRef = {name: '', key: ''};
    updateParentData({nameValuePairs: nameValuePairs.concat([['', {configMapSecretRef}, nameValuePairs.length]])}, nameValueId, EnvType.ENV_FROM);
  }

  _remove(i) {
    const {updateParentData, nameValueId} = this.props;
    const nameValuePairs = _.cloneDeep(this.props.nameValuePairs);
    nameValuePairs.splice(i, 1);
    const configMapSecretRef = {name: '', key: ''};

    updateParentData({nameValuePairs: nameValuePairs.length ? nameValuePairs : [['', {configMapSecretRef}]]}, nameValueId, EnvType.ENV_FROM);
  }

  _change(e, i, type) {
    const {updateParentData, nameValueId} = this.props;
    const nameValuePairs = _.cloneDeep(this.props.nameValuePairs);
    nameValuePairs[i][type === EnvFromPair.Prefix ? EnvFromPair.Prefix : EnvFromPair.Resource] = e.target.value;
    updateParentData({nameValuePairs}, nameValueId, EnvType.ENV_FROM);
  }

  _move(dragIndex, hoverIndex) {
    const {updateParentData, nameValueId} = this.props;
    const nameValuePairs = _.cloneDeep(this.props.nameValuePairs);
    const movedPair = nameValuePairs[dragIndex];

    nameValuePairs[dragIndex] = nameValuePairs[hoverIndex];
    nameValuePairs[hoverIndex] = movedPair;
    updateParentData({nameValuePairs}, nameValueId, EnvType.ENV_FROM);
  }

  render() {
    const {nameValuePairs, readOnly, nameValueId, configMaps, secrets} = this.props;
    const pairElems = nameValuePairs.map((pair, i) => {
      const key = _.get(pair, [EnvFromPair.Index], i);

      return <EnvFromPairElement onChange={this._change} index={i} nameString="config map/secret" valueString="" readOnly={readOnly} pair={pair} key={key} onRemove={this._remove} onMove={this._move} rowSourceId={nameValueId} configMaps={configMaps} secrets={secrets} />;
    });

    return <React.Fragment>
      <div className="row">
        {!readOnly && <div className="col-xs-1 co-empty__header"></div>}
        <div className="col-xs-5 text-secondary text-uppercase co-full__header">Config Map/Secret</div>
        <div className="col-xs-5 text-secondary text-uppercase co-full__header">Prefix (Optional)</div>
        <div className="col-xs-1 co-empty__header"></div>
      </div>
      {pairElems}
      <div className="row">
        <div className="col-xs-12">
          {
            !readOnly &&
            <button type="button" className="btn-link pairs-list__btn" onClick={this._append}>
              <i aria-hidden="true" className="fa fa-plus-circle pairs-list__add-icon" />Add All From Config Map or Secret
            </button>
          }
        </div>
      </div>
    </React.Fragment>;
  }
});
EnvFromEditor.propTypes = {
  readOnly: PropTypes.bool,
  nameValueId: PropTypes.number,
  nameValuePairs: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
      PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.number])),
    ])
  ).isRequired,
  updateParentData: PropTypes.func.isRequired,
  configMaps: PropTypes.object,
  secrets: PropTypes.object,
};
EnvFromEditor.defaultProps = {
  readOnly: false,
  nameValueId: 0,
};


const pairSource = {
  beginDrag(props) {
    return {
      index: props.index,
      rowSourceId: props.rowSourceId,
    };
  },
};

const itemTarget = {
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    // Don't replace items with themselves or with other row groupings on the page
    if (dragIndex === hoverIndex || monitor.getItem().rowSourceId !== props.rowSourceId) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = component.node.getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    props.onMove(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  },
};

const collectSourcePair = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging(),
});

const collectTargetPair = (connect) => ({
  connectDropTarget: connect.dropTarget(),
});

const PairElement = DragSource(DRAGGABLE_TYPE.ENV_ROW, pairSource, collectSourcePair)(DropTarget(DRAGGABLE_TYPE.ENV_ROW, itemTarget, collectTargetPair)(class PairElement extends React.Component {
  constructor(props) {
    super(props);

    this._onRemove = this._onRemove.bind(this);
    this._onChangeName = this._onChangeName.bind(this);
    this._onChangeValue = this._onChangeValue.bind(this);
  }

  _onRemove() {
    const {index, onRemove} = this.props;
    onRemove(index);
  }

  _onChangeName(e) {
    const {index, onChange} = this.props;
    onChange(e, index, NameValueEditorPair.Name);
  }

  _onChangeValue(e) {
    const {index, onChange} = this.props;
    onChange(e, index, NameValueEditorPair.Value);
  }

  render() {
    const {isDragging, connectDragSource, connectDragPreview, connectDropTarget, nameString, valueString, allowSorting, readOnly, pair, configMaps, secrets} = this.props;
    const deleteButton = <React.Fragment><i className="fa fa-minus-circle pairs-list__side-btn pairs-list__delete-icon" aria-hidden="true"></i><span className="sr-only">Delete</span></React.Fragment>;

    return connectDropTarget(
      connectDragPreview(
        <div className={classNames('row', isDragging ? 'pairs-list__row-dragging' : 'pairs-list__row')} ref={node => this.node = node}>
          {allowSorting && !readOnly &&
            <div className="col-xs-1 pairs-list__action">
              {connectDragSource(<button type="button" className="btn btn-link pairs-list__action-icon" tabIndex="-1">
                <i className="pficon pficon-drag-drop pairs-list__action-icon--reorder" />
              </button>)}
            </div>
          }
          <div className="col-xs-5 pairs-list__name-field">
            <input type="text" className="form-control" placeholder={nameString.toLowerCase()} value={pair[NameValueEditorPair.Name]} onChange={this._onChangeName} disabled={readOnly} />
          </div>
          {
            _.isPlainObject(pair[NameValueEditorPair.Value]) ?
              <div className="col-xs-5 pairs-list__value-pair-field">
                <ValueFromPair pair={pair[NameValueEditorPair.Value]} configMaps={configMaps} secrets={secrets} onChange={this._onChangeValue} disabled={readOnly} />
              </div>
              :
              <div className="col-xs-5 pairs-list__value-field">
                <input type="text" className="form-control" placeholder={valueString.toLowerCase()} value={pair[NameValueEditorPair.Value] || ''} onChange={this._onChangeValue} disabled={readOnly} />
              </div>
          }
          {
            !readOnly &&
              <div className="col-xs-1">
                <button type="button" className={classNames('btn', 'btn-link', {'pairs-list__span-btns': allowSorting})} onClick={this._onRemove}>
                  {deleteButton}
                </button>
              </div>
          }
        </div>)
    );
  }
}));
PairElement.propTypes = {
  nameString: PropTypes.string,
  valueString: PropTypes.string,
  readOnly: PropTypes.bool,
  index: PropTypes.number.isRequired,
  pair: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.number])),
  ]),
  allowSorting: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  connectDragSource: PropTypes.func,
  connectDropTarget: PropTypes.func,
  isDragging: PropTypes.bool,
  onMove: PropTypes.func.isRequired,
  rowSourceId: PropTypes.number.isRequired,
  configMaps: PropTypes.object,
  secrets: PropTypes.object,
};

const EnvFromPairElement = DragSource(DRAGGABLE_TYPE.ENV_FROM_ROW, pairSource, collectSourcePair)(DropTarget(DRAGGABLE_TYPE.ENV_FROM_ROW, itemTarget, collectTargetPair)(class EnvFromPairElement extends React.Component {
  constructor(props) {
    super(props);

    this._onRemove = this._onRemove.bind(this);
    this._onChangePrefix = this._onChangePrefix.bind(this);
    this._onChangeResource = this._onChangeResource.bind(this);
  }

  _onRemove() {
    const {index, onRemove} = this.props;
    onRemove(index);
  }

  _onChangePrefix(e) {
    const {index, onChange} = this.props;
    onChange(e, index, EnvFromPair.Prefix);
  }

  _onChangeResource(e) {
    const {index, onChange} = this.props;
    onChange(e, index, EnvFromPair.Resource);
  }

  render() {
    const {isDragging, connectDragSource, connectDragPreview, connectDropTarget, valueString, readOnly, pair, configMaps, secrets} = this.props;
    const deleteButton = <React.Fragment><i className="fa fa-minus-circle pairs-list__side-btn pairs-list__delete-icon" aria-hidden="true"></i><span className="sr-only">Delete</span></React.Fragment>;

    return connectDropTarget(
      connectDragPreview(
        <div className={classNames('row', isDragging ? 'pairs-list__row-dragging' : 'pairs-list__row')} ref={node => this.node = node}>
          { !readOnly &&
            <div className="col-xs-1 pairs-list__action">
              {connectDragSource(<button type="button" className="btn btn-link pairs-list__action-icon" tabIndex="-1">
                <i className="pficon pficon-drag-drop pairs-list__action-icon--reorder" />
              </button>)}
            </div>
          }
          <div className="col-xs-5 pairs-list__value-pair-field">
            <ValueFromPair pair={pair[EnvFromPair.Resource]} configMaps={configMaps} secrets={secrets} onChange={this._onChangeResource} disabled={readOnly} />
          </div>
          <div className="col-xs-5 pairs-list__name-field">
            <input type="text" className="form-control" placeholder={valueString.toLowerCase()} value={pair[EnvFromPair.Prefix]} onChange={this._onChangePrefix} disabled={readOnly} />
          </div>
          {
            readOnly ? null :
              <div className="col-xs-1">
                <button type="button" className="btn btn-link pairs-list__span-btns" onClick={this._onRemove}>
                  {deleteButton}
                </button>
              </div>
          }
        </div>)
    );
  }
}));
EnvFromPairElement.propTypes = {
  valueString: PropTypes.string,
  readOnly: PropTypes.bool,
  index: PropTypes.number.isRequired,
  pair: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.number])),
  ]),
  onChange: PropTypes.func.isRequired,
  connectDragSource: PropTypes.func,
  connectDropTarget: PropTypes.func,
  isDragging: PropTypes.bool,
  onMove: PropTypes.func.isRequired,
  rowSourceId: PropTypes.number.isRequired,
  configMaps: PropTypes.object,
  secrets: PropTypes.object,
};
