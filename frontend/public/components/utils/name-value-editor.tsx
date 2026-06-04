import { useCallback } from 'react';
import type { FC, Key } from 'react';
import * as _ from 'lodash';
import type { DragDropSortProps, DraggableObject } from '@patternfly/react-drag-drop';
import { DragDropSort } from '@patternfly/react-drag-drop';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Button,
  Grid,
  GridItem,
  TextInput,
  Tooltip,
} from '@patternfly/react-core';
import type { TextInputProps } from '@patternfly/react-core';
import { RhUiMinusCircleIcon, RhUiAddCircleFillIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import { NameValueEditorPair, EnvFromPair, EnvType } from './types';
import { ValueFromPair } from './value-from-pair';
import type { ValueFromPairProps, PairValue, RefChangeValue } from './value-from-pair';

interface NameValueEditorProps {
  nameString?: string;
  valueString?: string;
  addString?: string;
  allowSorting?: boolean;
  readOnly?: boolean;
  nameValueId?: number;
  nameValuePairs: PairValue[][];
  updateParentData: (data: { nameValuePairs: PairValue[][] }, nameValueId: number) => void;
  configMaps?: Record<string, unknown>;
  secrets?: Record<string, unknown>;
  addConfigMapSecret?: boolean;
  toolTip?: string;
  onLastItemRemoved?: () => void;
}

interface EnvFromEditorProps {
  readOnly?: boolean;
  nameValueId?: number;
  nameValuePairs: PairValue[][];
  updateParentData: (
    data: { nameValuePairs: PairValue[][] },
    nameValueId: number,
    envType: EnvType,
  ) => void;
  configMaps?: Record<string, unknown>;
  secrets?: Record<string, unknown>;
  serviceAccounts?: Record<string, unknown>;
  firstTitle?: string;
  secondTitle?: string;
  addButtonDisabled?: boolean;
  addButtonLabel?: string;
}

type PairChangeValue = string | RefChangeValue;

interface PairElementProps {
  nameString: string;
  valueString: string;
  readOnly: boolean;
  index: number;
  pair: PairValue[];
  onChange: (value: PairChangeValue, index: number, type: NameValueEditorPair) => void;
  onRemove: (index: number) => void;
  configMaps?: Record<string, unknown>;
  secrets?: Record<string, unknown>;
  isEmpty: boolean;
  toolTip?: string;
  alwaysAllowRemove: boolean;
}

interface EnvFromPairElementProps {
  valueString: string;
  readOnly: boolean;
  index: number;
  pair: PairValue[];
  onChange: (value: PairChangeValue, index: number, type: EnvFromPair) => void;
  onRemove: (index: number) => void;
  configMaps?: Record<string, unknown>;
  secrets?: Record<string, unknown>;
  serviceAccounts?: Record<string, unknown>;
}

const PairElement: FC<PairElementProps> = ({
  nameString,
  valueString,
  readOnly,
  index,
  pair,
  onChange,
  onRemove,
  configMaps,
  secrets,
  isEmpty,
  toolTip,
  alwaysAllowRemove,
}) => {
  const { t } = useTranslation('public');

  const handleRemove = () => onRemove(index);
  const handleChangeName: TextInputProps['onChange'] = (_event, value) =>
    onChange(value, index, NameValueEditorPair.Name);
  const handleChangeValue: TextInputProps['onChange'] = (_event, value) =>
    onChange(value, index, NameValueEditorPair.Value);
  const handleChangeValueFromPair: ValueFromPairProps['onChange'] = (e) =>
    onChange(e.target.value, index, NameValueEditorPair.Value);

  return (
    <Grid hasGutter className="pairs-list__row pf-v6-u-flex-grow-1" data-test="pairs-list-row">
      <GridItem span={5} className="pairs-list__name-field">
        <TextInput
          type="text"
          data-test="pairs-list-name"
          placeholder={nameString}
          aria-label={nameString || t('Key')}
          value={pair[NameValueEditorPair.Name] as string}
          onChange={handleChangeName}
          isDisabled={readOnly}
        />
      </GridItem>
      {_.isPlainObject(pair[NameValueEditorPair.Value]) ? (
        <GridItem span={5} className="pairs-list__value-pair-field">
          <ValueFromPair
            data-test="pairs-list-value"
            pair={pair[NameValueEditorPair.Value]}
            configMaps={configMaps}
            secrets={secrets}
            onChange={handleChangeValueFromPair}
            disabled={readOnly}
          />
        </GridItem>
      ) : (
        <GridItem span={5} className="pairs-list__value-field">
          <TextInput
            type="text"
            data-test="pairs-list-value"
            placeholder={valueString}
            aria-label={valueString || t('Value')}
            value={(pair[NameValueEditorPair.Value] as string) || ''}
            onChange={handleChangeValue}
            isDisabled={readOnly}
          />
        </GridItem>
      )}
      {!readOnly && (
        <GridItem span={1} className="pairs-list__action">
          <Tooltip content={toolTip || t('Remove')}>
            <Button
              icon={<RhUiMinusCircleIcon className="pairs-list__delete-icon" />}
              type="button"
              data-test="delete-button"
              aria-label={t('Delete')}
              onClick={handleRemove}
              isDisabled={isEmpty && !alwaysAllowRemove}
              variant="plain"
            />
          </Tooltip>
        </GridItem>
      )}
    </Grid>
  );
};

const EnvFromPairElement: FC<EnvFromPairElementProps> = ({
  valueString,
  readOnly,
  index,
  pair,
  onChange,
  onRemove,
  configMaps,
  secrets,
  serviceAccounts,
}) => {
  const { t } = useTranslation('public');

  const handleRemove = () => onRemove(index);
  const handleChangePrefix: TextInputProps['onChange'] = (_event, value) =>
    onChange(value, index, EnvFromPair.Prefix);
  const handleChangeResource: ValueFromPairProps['onChange'] = (e) =>
    onChange(e.target.value, index, EnvFromPair.Resource);

  return (
    <Grid hasGutter className="pairs-list__row pf-v6-u-flex-grow-1">
      <GridItem span={5} className="pairs-list__value-pair-field">
        <ValueFromPair
          pair={pair[EnvFromPair.Resource]}
          configMaps={configMaps}
          secrets={secrets}
          serviceAccounts={serviceAccounts}
          onChange={handleChangeResource}
          disabled={readOnly}
        />
      </GridItem>
      <GridItem span={5} className="pairs-list__name-field">
        <TextInput
          data-test="env-prefix"
          data-test-id="env-prefix"
          type="text"
          placeholder={valueString}
          aria-label={valueString || t('Prefix (optional)')}
          value={pair[EnvFromPair.Prefix] as string}
          onChange={handleChangePrefix}
          isDisabled={readOnly}
        />
      </GridItem>
      {readOnly ? null : (
        <GridItem span={1} className="pairs-list__action">
          <Tooltip content={t('Remove')}>
            <Button
              icon={
                <RhUiMinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />
              }
              type="button"
              data-test="pairs-list__delete-from-btn"
              data-test-id="pairs-list__delete-from-btn"
              aria-label={t('Delete')}
              className="pairs-list__span-btns"
              onClick={handleRemove}
              variant="plain"
            />
          </Tooltip>
        </GridItem>
      )}
    </Grid>
  );
};

export const NameValueEditor: FC<NameValueEditorProps> = ({
  nameValuePairs,
  updateParentData,
  nameValueId = 0,
  allowSorting = false,
  readOnly = false,
  addString,
  configMaps,
  secrets,
  addConfigMapSecret = false,
  toolTip,
  onLastItemRemoved,
  ...props
}) => {
  const { t } = useTranslation('public');
  const nameString = props.nameString || t('Key');
  const valueString = props.valueString || t('Value');

  const handleAppend = () => {
    updateParentData(
      { nameValuePairs: nameValuePairs.concat([['', '', nameValuePairs.length]]) },
      nameValueId,
    );
  };

  const handleAppendConfigMapOrSecret = () => {
    const configMapSecretKeyRef = { name: '', key: '' };
    updateParentData(
      {
        nameValuePairs: nameValuePairs.concat([
          ['', { configMapSecretKeyRef }, nameValuePairs.length],
        ]),
      },
      nameValueId,
    );
  };

  const handleRemove = (i: number) => {
    const pairs = _.cloneDeep(nameValuePairs);
    pairs.splice(i, 1);
    pairs.forEach((values, idx) => (values[2] = idx));

    updateParentData({ nameValuePairs: pairs.length ? pairs : [['', '', 0]] }, nameValueId);

    if (pairs.length === 0 && !!onLastItemRemoved) {
      onLastItemRemoved();
    }
  };

  const handleChange = (value: PairChangeValue, i: number, type: NameValueEditorPair) => {
    const pairs = _.cloneDeep(nameValuePairs);
    pairs[i][
      type === NameValueEditorPair.Name ? NameValueEditorPair.Name : NameValueEditorPair.Value
    ] = value;
    updateParentData({ nameValuePairs: pairs }, nameValueId);
  };

  const handleDrop = useCallback<DragDropSortProps['onDrop']>(
    (_event, newItems) => {
      const pairById = new Map(
        nameValuePairs.map((p) => [`pair-${p[NameValueEditorPair.Index]}`, p]),
      );
      const newPairs = newItems.map((item) => pairById.get(item.id as string)!);
      updateParentData({ nameValuePairs: newPairs }, nameValueId);
    },
    [nameValuePairs, nameValueId, updateParentData],
  );

  const useSorting = allowSorting && !readOnly && nameValuePairs.length > 1;
  const isEmpty = nameValuePairs.length === 1 && nameValuePairs[0].every((value) => !value);

  const makePairElement = (pair: PairValue[], i: number) => (
    <PairElement
      onChange={handleChange}
      index={i}
      nameString={nameString}
      valueString={valueString}
      readOnly={readOnly}
      pair={pair}
      onRemove={handleRemove}
      configMaps={configMaps}
      secrets={secrets}
      isEmpty={isEmpty}
      toolTip={toolTip}
      alwaysAllowRemove={!!onLastItemRemoved}
    />
  );

  return (
    <Grid hasGutter>
      {useSorting ? (
        <>
          <GridItem span={12}>
            <div className="pf-v6-u-display-flex">
              <div className="pairs-list__drag-spacer" />
              <Grid hasGutter className="pf-v6-u-flex-grow-1">
                <GridItem span={5}>{nameString}</GridItem>
                <GridItem span={5}>{valueString}</GridItem>
                <GridItem span={1} />
              </Grid>
            </div>
          </GridItem>
          <GridItem span={12}>
            <DragDropSort
              items={nameValuePairs.map(
                (pair, i): DraggableObject => ({
                  id: `pair-${(pair[NameValueEditorPair.Index] as number) ?? i}`,
                  props: {
                    dragButtonAriaLabel: t('Drag to reorder'),
                    className: 'pf-v6-u-display-flex pf-v6-u-align-items-center',
                  },
                  content: makePairElement(pair, i),
                }),
              )}
              onDrop={handleDrop}
            >
              <div className="pairs-list__drag-container" />
            </DragDropSort>
          </GridItem>
        </>
      ) : (
        <>
          <GridItem span={5}>{nameString}</GridItem>
          <GridItem span={5}>{valueString}</GridItem>
          <GridItem span={1} />
          {nameValuePairs.map((pair, i) => {
            const key = (pair[NameValueEditorPair.Index] as Key) ?? i;
            return (
              <GridItem span={12} key={key}>
                {makePairElement(pair, i)}
              </GridItem>
            );
          })}
        </>
      )}

      <GridItem>
        <ActionList>
          {readOnly ? null : (
            <ActionListGroup>
              <ActionListItem>
                <Button
                  icon={
                    <RhUiAddCircleFillIcon
                      data-test-id="pairs-list__add-icon"
                      className="co-icon-space-r"
                    />
                  }
                  className="pf-m-link--align-left"
                  data-test="add-button"
                  onClick={handleAppend}
                  type="button"
                  variant="link"
                >
                  {addString ? addString : t('Add more')}
                </Button>
              </ActionListItem>
              {addConfigMapSecret && (
                <ActionListItem>
                  <Button
                    icon={
                      <RhUiAddCircleFillIcon
                        data-test-id="pairs-list__add-icon"
                        className="co-icon-space-r"
                      />
                    }
                    className="pf-m-link--align-left"
                    onClick={handleAppendConfigMapOrSecret}
                    type="button"
                    variant="link"
                  >
                    {t('Add from ConfigMap or Secret')}
                  </Button>
                </ActionListItem>
              )}
            </ActionListGroup>
          )}
        </ActionList>
      </GridItem>
    </Grid>
  );
};
NameValueEditor.displayName = 'Name Value Editor';

export const EnvFromEditor: FC<EnvFromEditorProps> = ({
  nameValuePairs,
  updateParentData,
  nameValueId = 0,
  readOnly = false,
  configMaps,
  secrets,
  serviceAccounts,
  firstTitle,
  secondTitle,
  addButtonDisabled = false,
  addButtonLabel,
}) => {
  const { t } = useTranslation('public');

  const handleAppend = () => {
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
  };

  const handleRemove = (i: number) => {
    const pairs = _.cloneDeep(nameValuePairs);
    pairs.splice(i, 1);
    pairs.forEach((values, idx) => (values[EnvFromPair.Index] = idx));
    const configMapSecretRef = { name: '', key: '' };

    updateParentData(
      { nameValuePairs: pairs.length ? pairs : [['', { configMapSecretRef }, 0]] },
      nameValueId,
      EnvType.ENV_FROM,
    );
  };

  const handleChange = (value: PairChangeValue, i: number, type: EnvFromPair) => {
    const pairs = _.cloneDeep(nameValuePairs);
    pairs[i][type === EnvFromPair.Prefix ? EnvFromPair.Prefix : EnvFromPair.Resource] = value;
    updateParentData({ nameValuePairs: pairs }, nameValueId, EnvType.ENV_FROM);
  };

  const handleDrop = useCallback<DragDropSortProps['onDrop']>(
    (_event, newItems) => {
      const pairById = new Map(nameValuePairs.map((p) => [`pair-${p[EnvFromPair.Index]}`, p]));
      const newPairs = newItems.map((item) => pairById.get(item.id as string)!);
      updateParentData({ nameValuePairs: newPairs }, nameValueId, EnvType.ENV_FROM);
    },
    [nameValuePairs, nameValueId, updateParentData],
  );

  const useSorting = !readOnly && nameValuePairs.length > 1;

  const makeEnvFromElement = (pair: PairValue[], i: number) => (
    <EnvFromPairElement
      onChange={handleChange}
      index={i}
      valueString=""
      readOnly={readOnly}
      pair={pair}
      onRemove={handleRemove}
      configMaps={configMaps}
      secrets={secrets}
      serviceAccounts={serviceAccounts}
    />
  );

  return (
    <Grid hasGutter>
      {useSorting ? (
        <>
          <GridItem span={12}>
            <div className="pf-v6-u-display-flex">
              <div className="pairs-list__drag-spacer" />
              <Grid hasGutter className="pf-v6-u-flex-grow-1">
                <GridItem span={5} className="pf-v6-u-text-color-subtle">
                  {firstTitle || t('ConfigMap/Secret')}
                </GridItem>
                <GridItem span={5} className="pf-v6-u-text-color-subtle">
                  {secondTitle || t('Prefix (optional)')}
                </GridItem>
                <GridItem span={1} />
              </Grid>
            </div>
          </GridItem>
          <GridItem span={12}>
            <DragDropSort
              items={nameValuePairs.map(
                (pair, i): DraggableObject => ({
                  id: `pair-${(pair[EnvFromPair.Index] as number) ?? i}`,
                  props: { className: 'pf-v6-u-display-flex pf-v6-u-align-items-center' },
                  content: makeEnvFromElement(pair, i),
                }),
              )}
              onDrop={handleDrop}
            >
              <div className="pairs-list__drag-container" />
            </DragDropSort>
          </GridItem>
        </>
      ) : (
        <>
          <GridItem span={5} className="pf-v6-u-text-color-subtle">
            {firstTitle || t('ConfigMap/Secret')}
          </GridItem>
          <GridItem span={5} className="pf-v6-u-text-color-subtle">
            {secondTitle || t('Prefix (optional)')}
          </GridItem>
          <GridItem span={1} />
          {nameValuePairs.map((pair, i) => {
            const key = (pair[EnvFromPair.Index] as Key) ?? i;
            return (
              <GridItem span={12} key={key}>
                {makeEnvFromElement(pair, i)}
              </GridItem>
            );
          })}
        </>
      )}

      {!readOnly && (
        <GridItem>
          <ActionList>
            <ActionListGroup>
              <Button
                icon={<RhUiAddCircleFillIcon />}
                className="pf-m-link--align-left"
                onClick={handleAppend}
                type="button"
                variant="link"
                isDisabled={addButtonDisabled}
              >
                {addButtonLabel || t('Add all from ConfigMap or Secret')}
              </Button>
            </ActionListGroup>
          </ActionList>
        </GridItem>
      )}
    </Grid>
  );
};
