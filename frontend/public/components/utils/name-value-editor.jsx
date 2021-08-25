import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { DragSource, DropTarget } from 'react-dnd';
import { DRAGGABLE_TYPE } from './draggable-item-types';
import { Button, Tooltip } from '@patternfly/react-core';
import { GripVerticalIcon, MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { withTranslation } from 'react-i18next';

import { NameValueEditorPair, EnvFromPair, EnvType } from './index';
import { ValueFromPair } from './value-from-pair';
import withDragDropContext from './drag-drop-context';

const NameValueEditor_ = withDragDropContext(
  class NameValueEditor extends React.Component {
    constructor(props) {
      super(props);
      this._append = this._append.bind(this);
      this._appendConfigMapOrSecret = this._appendConfigMapOrSecret.bind(this);
      this._change = this._change.bind(this);
      this._move = this._move.bind(this);
      this._remove = this._remove.bind(this);
    }

    _append() {
      const { updateParentData, nameValuePairs, nameValueId } = this.props;

      updateParentData(
        { nameValuePairs: nameValuePairs.concat([['', '', nameValuePairs.length]]) },
        nameValueId,
      );
    }

    _appendConfigMapOrSecret() {
      const { updateParentData, nameValuePairs, nameValueId } = this.props;
      const configMapSecretKeyRef = { name: '', key: '' };
      updateParentData(
        {
          nameValuePairs: nameValuePairs.concat([
            ['', { configMapSecretKeyRef }, nameValuePairs.length],
          ]),
        },
        nameValueId,
      );
    }

    _remove(i) {
      const { updateParentData, nameValueId, onLastItemRemoved } = this.props;
      const nameValuePairs = _.cloneDeep(this.props.nameValuePairs);
      nameValuePairs.splice(i, 1);
      nameValuePairs.forEach((values, index) => (values[2] = index)); // update the indices in order.

      updateParentData(
        { nameValuePairs: nameValuePairs.length ? nameValuePairs : [['', '', 0]] },
        nameValueId,
      );

      if (nameValuePairs.length === 0 && !!onLastItemRemoved) {
        onLastItemRemoved();
      }
    }

    _change(e, i, type) {
      const { updateParentData, nameValueId } = this.props;
      const nameValuePairs = _.cloneDeep(this.props.nameValuePairs);

      nameValuePairs[i][
        type === NameValueEditorPair.Name ? NameValueEditorPair.Name : NameValueEditorPair.Value
      ] = e.target.value;
      updateParentData({ nameValuePairs }, nameValueId);
    }

    _move(dragIndex, hoverIndex) {
      const { updateParentData, nameValueId } = this.props;
      const nameValuePairs = _.cloneDeep(this.props.nameValuePairs);
      const movedPair = nameValuePairs[dragIndex];

      nameValuePairs[dragIndex] = nameValuePairs[hoverIndex];
      nameValuePairs[hoverIndex] = movedPair;
      updateParentData({ nameValuePairs }, nameValueId);
    }

    render() {
      const {
        addString,
        nameValuePairs,
        allowSorting,
        readOnly,
        nameValueId,
        configMaps,
        secrets,
        addConfigMapSecret,
        toolTip,
        t,
        onLastItemRemoved,
      } = this.props;
      const nameString = this.props.nameString || t('public~Key');
      const valueString = this.props.valueString || t('public~Value');
      const pairElems = nameValuePairs.map((pair, i) => {
        const key = _.get(pair, [NameValueEditorPair.Index], i);
        const isEmpty = nameValuePairs.length === 1 && nameValuePairs[0].every((value) => !value);
        return (
          <PairElement
            onChange={this._change}
            index={i}
            nameString={nameString}
            valueString={valueString}
            allowSorting={allowSorting}
            readOnly={readOnly}
            pair={pair}
            key={key}
            onRemove={this._remove}
            onMove={this._move}
            rowSourceId={nameValueId}
            configMaps={configMaps}
            secrets={secrets}
            isEmpty={isEmpty}
            disableReorder={nameValuePairs.length === 1}
            toolTip={toolTip}
            alwaysAllowRemove={!!onLastItemRemoved}
          />
        );
      });
      return (
        <>
          <div className="row pairs-list__heading">
            {!readOnly && allowSorting && <div className="col-xs-1 co-empty__header" />}
            <div className="col-xs-5">{nameString}</div>
            <div className="col-xs-5">{valueString}</div>
            <div className="col-xs-1 co-empty__header" />
          </div>
          {pairElems}
          <div className="row">
            <div className="col-xs-12">
              {readOnly ? null : (
                <div className="co-toolbar__group co-toolbar__group--left">
                  <Button
                    className="pf-m-link--align-left"
                    data-test="add-button"
                    onClick={this._append}
                    type="button"
                    variant="link"
                  >
                    <PlusCircleIcon
                      data-test-id="pairs-list__add-icon"
                      className="co-icon-space-r"
                    />
                    {addString ? addString : t('public~Add more')}
                  </Button>
                  {addConfigMapSecret && (
                    <>
                      <Button
                        className="pf-m-link--align-left"
                        onClick={this._appendConfigMapOrSecret}
                        type="button"
                        variant="link"
                      >
                        <PlusCircleIcon
                          data-test-id="pairs-list__add-icon"
                          className="co-icon-space-r"
                        />
                        {t('public~Add from ConfigMap or Secret')}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      );
    }
  },
);

export const NameValueEditor = withTranslation()(NameValueEditor_);

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
      PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.number]),
      ),
    ]),
  ).isRequired,
  updateParentData: PropTypes.func.isRequired,
  configMaps: PropTypes.object,
  secrets: PropTypes.object,
  addConfigMapSecret: PropTypes.bool,
  toolTip: PropTypes.string,
  onLastItemRemoved: PropTypes.func,
};
NameValueEditor.defaultProps = {
  allowSorting: false,
  readOnly: false,
  nameValueId: 0,
  addConfigMapSecret: false,
};

NameValueEditor.displayName = 'Name Value Editor';

const EnvFromEditor_ = withDragDropContext(
  class EnvFromEditor extends React.Component {
    constructor(props) {
      super(props);
      this._append = this._append.bind(this);
      this._change = this._change.bind(this);
      this._move = this._move.bind(this);
      this._remove = this._remove.bind(this);
    }

    _append() {
      const { updateParentData, nameValuePairs, nameValueId } = this.props;
      const configMapSecretRef = { name: '', key: '' };
      updateParentData(
        {
          nameValuePairs: nameValuePairs.concat([
            ['', { configMapSecretRef }, nameValuePairs.length],
          ]),
        },
        nameValueId,
        EnvType.ENV_FROM,
      );
    }

    _remove(i) {
      const { updateParentData, nameValueId } = this.props;
      const nameValuePairs = _.cloneDeep(this.props.nameValuePairs);
      nameValuePairs.splice(i, 1);
      const configMapSecretRef = { name: '', key: '' };

      updateParentData(
        { nameValuePairs: nameValuePairs.length ? nameValuePairs : [['', { configMapSecretRef }]] },
        nameValueId,
        EnvType.ENV_FROM,
      );
    }

    _change(e, i, type) {
      const { updateParentData, nameValueId } = this.props;
      const nameValuePairs = _.cloneDeep(this.props.nameValuePairs);
      nameValuePairs[i][type === EnvFromPair.Prefix ? EnvFromPair.Prefix : EnvFromPair.Resource] =
        e.target.value;
      updateParentData({ nameValuePairs }, nameValueId, EnvType.ENV_FROM);
    }

    _move(dragIndex, hoverIndex) {
      const { updateParentData, nameValueId } = this.props;
      const nameValuePairs = _.cloneDeep(this.props.nameValuePairs);
      const movedPair = nameValuePairs[dragIndex];

      nameValuePairs[dragIndex] = nameValuePairs[hoverIndex];
      nameValuePairs[hoverIndex] = movedPair;
      updateParentData({ nameValuePairs }, nameValueId, EnvType.ENV_FROM);
    }

    render() {
      const {
        nameValuePairs,
        readOnly,
        nameValueId,
        configMaps,
        secrets,
        serviceAccounts,
        firstTitle,
        secondTitle,
        addButtonDisabled,
        addButtonLabel,
        t,
      } = this.props;
      const pairElems = nameValuePairs.map((pair, i) => {
        const key = _.get(pair, [EnvFromPair.Index], i);

        return (
          <EnvFromPairElement
            onChange={this._change}
            index={i}
            nameString={t('public~ConfigMap/Secret')}
            valueString=""
            readOnly={readOnly}
            pair={pair}
            key={key}
            onRemove={this._remove}
            onMove={this._move}
            rowSourceId={nameValueId}
            configMaps={configMaps}
            secrets={secrets}
            serviceAccounts={serviceAccounts}
          />
        );
      });

      return (
        <>
          <div className="row pairs-list__heading">
            {!readOnly && <div className="col-xs-1 co-empty__header" />}
            <div className="col-xs-5 text-secondary text-uppercase">
              {firstTitle || t('public~ConfigMap/Secret')}
            </div>
            <div className="col-xs-5 text-secondary text-uppercase">
              {secondTitle || t('public~Prefix (optional)')}
            </div>
            <div className="col-xs-1 co-empty__header" />
          </div>
          {pairElems}
          <div className="row">
            <div className="col-xs-12">
              {!readOnly && (
                <Button
                  className="pf-m-link--align-left"
                  onClick={this._append}
                  type="button"
                  variant="link"
                  isDisabled={addButtonDisabled}
                >
                  <PlusCircleIcon />{' '}
                  {addButtonLabel || t('public~Add all from ConfigMap or Secret')}
                </Button>
              )}
            </div>
          </div>
        </>
      );
    }
  },
);
export const EnvFromEditor = withTranslation()(EnvFromEditor_);
EnvFromEditor.propTypes = {
  readOnly: PropTypes.bool,
  nameValueId: PropTypes.number,
  nameValuePairs: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
      PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.number]),
      ),
    ]),
  ).isRequired,
  updateParentData: PropTypes.func.isRequired,
  configMaps: PropTypes.object,
  secrets: PropTypes.object,
  serviceAccounts: PropTypes.object,
  firstTitle: PropTypes.string,
  secondTitle: PropTypes.string,
  addButtonDisabled: PropTypes.bool,
};
EnvFromEditor.defaultProps = {
  readOnly: false,
  nameValueId: 0,
  addButtonDisabled: false,
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

const PairElement_ = DragSource(
  DRAGGABLE_TYPE.ENV_ROW,
  pairSource,
  collectSourcePair,
)(
  DropTarget(
    DRAGGABLE_TYPE.ENV_ROW,
    itemTarget,
    collectTargetPair,
  )(
    class PairElement extends React.Component {
      constructor(props) {
        super(props);

        this._onRemove = this._onRemove.bind(this);
        this._onChangeName = this._onChangeName.bind(this);
        this._onChangeValue = this._onChangeValue.bind(this);
      }

      _onRemove() {
        const { index, onRemove } = this.props;
        onRemove(index);
      }

      _onChangeName(e) {
        const { index, onChange } = this.props;
        onChange(e, index, NameValueEditorPair.Name);
      }

      _onChangeValue(e) {
        const { index, onChange } = this.props;
        onChange(e, index, NameValueEditorPair.Value);
      }

      render() {
        const {
          isDragging,
          connectDragSource,
          connectDragPreview,
          connectDropTarget,
          nameString,
          allowSorting,
          readOnly,
          pair,
          configMaps,
          secrets,
          isEmpty,
          disableReorder,
          toolTip,
          t,
          valueString,
          alwaysAllowRemove,
        } = this.props;
        const deleteIcon = (
          <>
            <MinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />
            <span className="sr-only">{t('public~Delete')}</span>
          </>
        );
        const dragButton = (
          <div>
            <Button
              type="button"
              className="pairs-list__action-icon"
              tabIndex="-1"
              isDisabled={disableReorder}
              variant="plain"
              aria-label={t('public~Drag to reorder')}
            >
              <GripVerticalIcon className="pairs-list__action-icon--reorder" />
            </Button>
          </div>
        );
        return connectDropTarget(
          connectDragPreview(
            <div
              className={classNames(
                'row',
                isDragging ? 'pairs-list__row-dragging' : 'pairs-list__row',
              )}
              data-test="pairs-list-row"
              ref={(node) => (this.node = node)}
            >
              {allowSorting && !readOnly && (
                <div className="col-xs-1 pairs-list__action">
                  {disableReorder ? dragButton : connectDragSource(dragButton)}
                </div>
              )}
              <div className="col-xs-5 pairs-list__name-field">
                <input
                  type="text"
                  data-test="pairs-list-name"
                  className="pf-c-form-control"
                  placeholder={nameString}
                  value={pair[NameValueEditorPair.Name]}
                  onChange={this._onChangeName}
                  disabled={readOnly}
                />
              </div>
              {_.isPlainObject(pair[NameValueEditorPair.Value]) ? (
                <div className="col-xs-5 pairs-list__value-pair-field">
                  <ValueFromPair
                    data-test="pairs-list-value"
                    pair={pair[NameValueEditorPair.Value]}
                    configMaps={configMaps}
                    secrets={secrets}
                    onChange={this._onChangeValue}
                    disabled={readOnly}
                  />
                </div>
              ) : (
                <div className="col-xs-5 pairs-list__value-field">
                  <input
                    type="text"
                    data-test="pairs-list-value"
                    className="pf-c-form-control"
                    placeholder={valueString}
                    value={pair[NameValueEditorPair.Value] || ''}
                    onChange={this._onChangeValue}
                    disabled={readOnly}
                  />
                </div>
              )}
              {!readOnly && (
                <div className="col-xs-1 pairs-list__action">
                  <Tooltip content={toolTip || t('public~Remove')}>
                    <Button
                      type="button"
                      data-test="delete-button"
                      className={classNames({
                        'pairs-list__span-btns': allowSorting,
                      })}
                      onClick={this._onRemove}
                      isDisabled={isEmpty && !alwaysAllowRemove}
                      variant="plain"
                    >
                      {deleteIcon}
                    </Button>
                  </Tooltip>
                </div>
              )}
            </div>,
          ),
        );
      }
    },
  ),
);
const PairElement = withTranslation()(PairElement_);
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
  toolTip: PropTypes.string,
  alwaysAllowRemove: PropTypes.bool,
};
const EnvFromPairElement_ = DragSource(
  DRAGGABLE_TYPE.ENV_FROM_ROW,
  pairSource,
  collectSourcePair,
)(
  DropTarget(
    DRAGGABLE_TYPE.ENV_FROM_ROW,
    itemTarget,
    collectTargetPair,
  )(
    class EnvFromPairElement extends React.Component {
      constructor(props) {
        super(props);
        this._onRemove = this._onRemove.bind(this);
        this._onChangePrefix = this._onChangePrefix.bind(this);
        this._onChangeResource = this._onChangeResource.bind(this);
      }
      _onRemove() {
        const { index, onRemove } = this.props;
        onRemove(index);
      }
      _onChangePrefix(e) {
        const { index, onChange } = this.props;
        onChange(e, index, EnvFromPair.Prefix);
      }
      _onChangeResource(e) {
        const { index, onChange } = this.props;
        onChange(e, index, EnvFromPair.Resource);
      }
      render() {
        const {
          isDragging,
          connectDragSource,
          connectDragPreview,
          connectDropTarget,
          valueString,
          readOnly,
          pair,
          configMaps,
          secrets,
          serviceAccounts,
          t,
        } = this.props;
        const deleteButton = (
          <>
            <MinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />
            <span className="sr-only">{t('public~Delete')}</span>
          </>
        );
        return connectDropTarget(
          connectDragPreview(
            <div
              className={classNames(
                'row',
                isDragging ? 'pairs-list__row-dragging' : 'pairs-list__row',
              )}
              ref={(node) => (this.node = node)}
            >
              {!readOnly &&
                connectDragSource(
                  <div className="col-xs-1 pairs-list__action">
                    <Button
                      type="button"
                      className="pairs-list__action-icon"
                      tabIndex="-1"
                      variant="plain"
                      aria-label={t('public~Drag to reorder')}
                    >
                      <GripVerticalIcon className="pairs-list__action-icon--reorder" />
                    </Button>
                  </div>,
                )}
              <div className="col-xs-5 pairs-list__value-pair-field">
                <ValueFromPair
                  pair={pair[EnvFromPair.Resource]}
                  configMaps={configMaps}
                  secrets={secrets}
                  serviceAccounts={serviceAccounts}
                  onChange={this._onChangeResource}
                  disabled={readOnly}
                />
              </div>
              <div className="col-xs-5 pairs-list__name-field">
                <input
                  data-test-id="env-prefix"
                  type="text"
                  className="pf-c-form-control"
                  placeholder={valueString}
                  value={pair[EnvFromPair.Prefix]}
                  onChange={this._onChangePrefix}
                  disabled={readOnly}
                />
              </div>
              {readOnly ? null : (
                <div className="col-xs-1 pairs-list__action">
                  <Tooltip content={t('public~Remove')}>
                    <Button
                      type="button"
                      data-test-id="pairs-list__delete-from-btn"
                      className="pairs-list__span-btns"
                      onClick={this._onRemove}
                      variant="plain"
                    >
                      {deleteButton}
                    </Button>
                  </Tooltip>
                </div>
              )}
            </div>,
          ),
        );
      }
    },
  ),
);
const EnvFromPairElement = withTranslation()(EnvFromPairElement_);
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
