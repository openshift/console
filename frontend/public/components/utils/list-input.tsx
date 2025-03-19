import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { Button } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
/* eslint-disable-next-line */
import { withTranslation, WithTranslation } from 'react-i18next';

class ListInput_ extends React.Component<ListInputProps, ListInputState> {
  private helpID: string = _.uniqueId('list-view-help-');
  constructor(props: ListInputProps) {
    super(props);
    this.state = {
      values: props.initialValues || [''],
    };
  }

  componentDidUpdate(prevProps: ListInputProps, prevState: ListInputState) {
    if (prevState.values !== this.state.values) {
      const values = _.compact(this.state.values);
      this.props.onChange(values);
    }
  }

  valueChanged(i: number, v: string) {
    this.setState((state) => {
      const values = [...state.values];
      values[i] = v;
      return { values };
    });
  }

  addValue() {
    this.setState((state) => ({ values: [...state.values, ''] }));
  }

  removeValue(i: number) {
    this.setState((state) => {
      const values = [...state.values];
      values.splice(i, 1);
      return {
        values: _.isEmpty(values) ? [''] : values,
      };
    });
  }

  render() {
    const { label, required, helpText, t } = this.props;
    const { values } = this.state;
    const missingValues = required && (_.isEmpty(values) || _.every(values, (v) => !v));
    const isEmpty = values.length === 1 && (_.isEmpty(values) || _.every(values, (v) => !v));
    return (
      <div className="form-group">
        <label className={classNames('control-label', { 'co-required': required })}>{label}</label>
        {_.map(values, (v: string, i: number) => (
          <div className="co-list-input__row" key={i}>
            <div className="co-list-input__value">
              <span className="pf-v6-c-form-control">
                <input
                  type="text"
                  value={v}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    this.valueChanged(i, e.currentTarget.value)
                  }
                  required={missingValues && i === 0}
                  aria-describedby={helpText ? this.helpID : undefined}
                  data-test-list-input-for={label}
                />
              </span>
            </div>
            <Button
              icon={<MinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />}
              type="button"
              className="pairs-list__span-btns"
              onClick={() => this.removeValue(i)}
              aria-label={t('public~Remove')}
              variant="plain"
              disabled={isEmpty}
            />
          </div>
        ))}
        {helpText && (
          <div className="co-list-input__help-block help-block" id={this.helpID}>
            {helpText}
          </div>
        )}
        <Button
          icon={<PlusCircleIcon className="co-icon-space-r" />}
          className="pf-m-link--align-left"
          onClick={() => this.addValue()}
          type="button"
          variant="link"
        >
          {t('public~Add more')}
        </Button>
      </div>
    );
  }
}

export const ListInput = withTranslation()(ListInput_);

type ListInputState = {
  values: string[];
};

type ChangeCallback = (values: string[]) => void;

type ListInputProps = WithTranslation & {
  label: string;
  initialValues?: string[];
  onChange: ChangeCallback;
  helpText?: string;
  required?: boolean;
};
