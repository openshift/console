import * as _ from 'lodash-es';
import * as React from 'react';
import { withTranslation } from 'react-i18next';
import { WithT } from 'i18next';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { isBinary } from 'istextorbinary/edition-es2017';
import { KeyValueEntryFormState, SecretStringData, Base64StringData } from './types';
import { KeyValueEntryForm } from './KeyValueEntryForm';

class GenericSecretFormWithTranslation extends React.Component<
  GenericSecretFormProps & WithT,
  GenericSecretFormState
> {
  constructor(props) {
    super(props);
    this.state = {
      secretEntriesArray: this.genericSecretObjectToArray(this.props.base64StringData),
    };
    this.onDataChanged = this.onDataChanged.bind(this);
  }
  newGenericSecretEntry() {
    return {
      entry: {
        key: '',
        value: '',
      },
      uid: _.uniqueId(),
    };
  }
  genericSecretObjectToArray(base64StringData) {
    if (_.isEmpty(base64StringData)) {
      return [this.newGenericSecretEntry()];
    }
    if (base64StringData) {
      return _.map(base64StringData, (value, key) => {
        return {
          uid: _.uniqueId(),
          entry: {
            key,
            value,
            isBinary_: isBinary(null, Buffer.from(value || '', 'base64')),
          },
        };
      });
    }
  }
  genericSecretArrayToObject(genericSecretArray) {
    return _.reduce(
      genericSecretArray,
      (acc, k) =>
        _.assign(acc, {
          [k.entry.key]: k.entry.value,
        }),
      {},
    );
  }
  onDataChanged(updatedEntry, entryID) {
    const updatedSecretEntriesArray = [...this.state.secretEntriesArray];
    const updatedEntryData = {
      uid: updatedSecretEntriesArray[entryID].uid,
      entry: updatedEntry,
    };
    updatedSecretEntriesArray[entryID] = updatedEntryData;
    this.setState(
      {
        secretEntriesArray: updatedSecretEntriesArray,
      },
      () =>
        this.props.onChange({
          base64StringData: this.genericSecretArrayToObject(this.state.secretEntriesArray),
        }),
    );
  }
  removeEntry(entryID) {
    const updatedSecretEntriesArray = [...this.state.secretEntriesArray];
    updatedSecretEntriesArray.splice(entryID, 1);
    this.setState(
      {
        secretEntriesArray: updatedSecretEntriesArray,
      },
      () =>
        this.props.onChange({
          base64StringData: this.genericSecretArrayToObject(this.state.secretEntriesArray),
        }),
    );
  }
  addEntry() {
    this.setState(
      {
        secretEntriesArray: _.concat(this.state.secretEntriesArray, this.newGenericSecretEntry()),
      },
      () =>
        this.props.onChange({
          base64StringData: this.genericSecretArrayToObject(this.state.secretEntriesArray),
        }),
    );
  }
  render() {
    const { t } = this.props;
    const secretEntriesList = _.map(this.state.secretEntriesArray, (entryData, index) => {
      return (
        <div className="co-add-remove-form__entry" key={entryData.uid}>
          {_.size(this.state.secretEntriesArray) > 1 && (
            <div className="co-add-remove-form__link--remove-entry">
              <Button
                type="button"
                onClick={() => this.removeEntry(index)}
                variant="link"
                data-test="remove-entry-button"
              >
                <MinusCircleIcon className="co-icon-space-r" />
                {t('public~Remove key/value')}
              </Button>
            </div>
          )}
          <KeyValueEntryForm id={index} entry={entryData.entry} onChange={this.onDataChanged} />
        </div>
      );
    });
    return (
      <>
        {secretEntriesList}
        <Button
          className="co-create-secret-form__link--add-entry pf-m-link--align-left"
          onClick={() => this.addEntry()}
          type="button"
          variant="link"
          data-test="add-credentials-button"
        >
          <PlusCircleIcon className="co-icon-space-r" />
          {t('public~Add key/value')}
        </Button>
      </>
    );
  }
}

export const GenericSecretForm = withTranslation()(GenericSecretFormWithTranslation);

type GenericSecretFormProps = {
  onChange: Function;
  stringData: SecretStringData;
  base64StringData: Base64StringData;
  isCreate: boolean;
};

type GenericSecretFormState = {
  secretEntriesArray: {
    entry: KeyValueEntryFormState;
    uid: string;
  }[];
};
