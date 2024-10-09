import * as _ from 'lodash-es';
import * as React from 'react';
import { withTranslation } from 'react-i18next';
import { WithT } from 'i18next';
import { Base64 } from 'js-base64';
import { Button } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { KeyValueEntryFormState, KeyValueEntryForm, SecretSubFormProps } from '.';

class GenericSecretFormWithTranslation extends React.Component<
  SecretSubFormProps & WithT,
  GenericSecretFormState
> {
  constructor(props) {
    super(props);
    this.state = {
      secretEntriesArray: this.genericSecretObjectToArray(
        this.props.stringData,
        this.props.base64StringData,
      ),
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
  genericSecretObjectToArray(stringData, base64Data) {
    if (_.isEmpty(stringData)) {
      return [this.newGenericSecretEntry()];
    }
    return _.map(stringData, (value, key) => {
      return {
        uid: _.uniqueId(),
        entry: {
          key,
          value,
          isBinary: value == null && Boolean(base64Data[key]),
        },
      };
    });
  }

  genericSecretArrayToObject(entries) {
    return entries.reduce((acc, { entry }) => {
      return {
        stringData: {
          ...acc.stringData,
          [entry.key]: entry.isBinary ? null : entry.value,
        },
        base64StringData: {
          ...acc.base64StringData,
          [entry.key]: entry.isBinary ? entry.value : Base64.encode(entry.value),
        },
      };
    }, {});
  }

  onDataChanged(secretEntriesArray) {
    this.setState({ secretEntriesArray }, () =>
      this.props.onChange(this.genericSecretArrayToObject(this.state.secretEntriesArray)),
    );
  }

  updateEntry(updatedEntry, atIndex) {
    const newEntries = [...this.state.secretEntriesArray];
    const updatedEntryData = {
      uid: newEntries[atIndex].uid,
      entry: updatedEntry,
    };
    newEntries[atIndex] = updatedEntryData;
    this.onDataChanged(newEntries);
  }

  removeEntry(atIndex) {
    const newEntries = [...this.state.secretEntriesArray];
    newEntries.splice(atIndex, 1);
    this.onDataChanged(newEntries);
  }

  addEntry() {
    this.onDataChanged([...this.state.secretEntriesArray, this.newGenericSecretEntry()]);
  }

  render() {
    const { t } = this.props;
    const formFields = _.map(this.state.secretEntriesArray, (entryData, index) => {
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
          <KeyValueEntryForm id={index} entry={entryData.entry} onChange={this.updateEntry} />
        </div>
      );
    });

    return (
      <>
        {formFields}
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

type GenericSecretFormState = {
  secretEntriesArray: {
    entry: KeyValueEntryFormState;
    uid: string;
  }[];
};
