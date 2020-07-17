import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { MinusCircleIcon, PlusCircleIcon, InfoCircleIcon } from '@patternfly/react-icons';
import { Button, Tooltip } from '@patternfly/react-core';

import { ExternalLink, SectionHeading } from '../../utils';
import { RouteEditorLabel } from './alert-manager-receiver-forms';

const DEFAULT_RECEIVER_LABEL = 'All (default receiver)';
const labelNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const getRouteLabelFieldErrors = (labels: RouteEditorLabel[]) => {
  const routeLabelFieldErrors = {};
  labels.forEach((label, i) => {
    if (label.name && !label.name.match(labelNamePattern)) {
      routeLabelFieldErrors[`${i}_name`] = true;
    }
  });
  return routeLabelFieldErrors;
};

const hasDuplicateNames = (labels: RouteEditorLabel[]): boolean => {
  const names = _.map(labels, (label) => label.name);
  return names.length !== _.uniq(names).length;
};

export const RoutingLabelEditor = ({ formValues, dispatchFormChange, isDefaultReceiver }) => {
  const setRouteLabel = (path: string, v: any): void => {
    const labels = _.clone(formValues.routeLabels);
    _.set(labels, path.split(', '), v);
    dispatchFormChange({
      type: 'setFormValues',
      payload: {
        routeLabels: labels,
        routeLabelFieldErrors: getRouteLabelFieldErrors(labels),
        routeLabelDuplicateNamesError: hasDuplicateNames(labels),
      },
    });
  };

  const onRoutingLabelChange = (path: string): ((e) => void) => {
    return (e) => setRouteLabel(path, e.target.value);
  };

  const onRoutingLabelRegexChange = (e, i: number): void => {
    setRouteLabel(`${i}, isRegex`, e.target.checked);
  };

  const addRoutingLabel = (): void => {
    setRouteLabel(`${formValues.routeLabels.length}`, {
      name: '',
      value: '',
      isRegex: false,
    });
  };

  const removeRoutingLabel = (i: number): void => {
    const labels = _.clone(formValues.routeLabels);
    labels.splice(i, 1);
    dispatchFormChange({
      type: 'setFormValues',
      payload: {
        routeLabels: labels,
        routeLabelDuplicateNamesError: hasDuplicateNames(labels),
      },
    });
  };

  const InvalidLabelName = () => (
    <span data-test-id="invalid-label-name-error">
      Invalid name.
      <Tooltip
        content={
          <p>
            Label name must not begin with a digit and contain only alphanumeric characters or '_'.
          </p>
        }
      >
        <InfoCircleIcon className="co-icon-space-l" />
      </Tooltip>
    </span>
  );

  return (
    <div data-test-id="receiver-routing-labels-editor" className="form-group">
      <SectionHeading text="Routing Labels" required={!isDefaultReceiver} />
      <p className="co-help-text">
        Firing alerts with labels that match all of these selectors will be sent to this receiver.
        Label values can be matched exactly or with a &nbsp;
        <ExternalLink href="https://github.com/google/re2/wiki/Syntax" text="regular expression" />.
      </p>
      <div className="row monitoring-grid-head text-secondary text-uppercase">
        <div className="col-xs-5">Name</div>
        <div className="col-xs-6">Value</div>
      </div>
      {isDefaultReceiver && (
        <div className="row form-group" key="default">
          <div className="col-xs-10">
            <div className="row">
              <div className="col-xs-6 pairs-list__name-field">
                <div className="form-group">
                  <input
                    type="text"
                    className="pf-c-form-control"
                    data-test-id="label-name-default"
                    value={DEFAULT_RECEIVER_LABEL}
                    disabled
                    required
                  />
                </div>
              </div>
              <div className="col-xs-6 pairs-list__value-field">
                <div className="form-group">
                  <input
                    type="text"
                    className="pf-c-form-control"
                    data-test-id="label-value-default"
                    value={DEFAULT_RECEIVER_LABEL}
                    disabled
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {_.map(formValues.routeLabels, (routeLabel, i: number) => {
        const hasLabelNameError = formValues?.routeLabelFieldErrors?.[`${i}_name`];
        return (
          <div className="row form-group" key={i}>
            <div className="col-xs-10">
              <div className="row">
                <div className="col-xs-6 pairs-list__name-field">
                  <div
                    className={classNames('form-group', {
                      'has-error': hasLabelNameError,
                    })}
                  >
                    <input
                      type="text"
                      className="pf-c-form-control"
                      data-test-id={`label-name-${i}`}
                      onChange={onRoutingLabelChange(`${i}, name`)}
                      placeholder="Name"
                      value={routeLabel.name}
                      required
                    />
                    <span className="help-block">{hasLabelNameError && <InvalidLabelName />}</span>
                  </div>
                </div>
                <div className="col-xs-6 pairs-list__value-field">
                  <div className="form-group">
                    <input
                      type="text"
                      className="pf-c-form-control"
                      data-test-id={`label-value-${i}`}
                      onChange={onRoutingLabelChange(`${i}, value`)}
                      placeholder="Value"
                      value={routeLabel.value}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-xs-12 col-sm-12">
                  <div className="form-group">
                    <div className="checkbox">
                      <label className="control-label">
                        <input
                          type="checkbox"
                          onChange={(e) => onRoutingLabelRegexChange(e, i)}
                          checked={routeLabel.isRegex}
                        />
                        Regular Expression
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xs-2 pairs-list__action">
              <Tooltip content="Remove">
                <Button
                  type="button"
                  onClick={() => removeRoutingLabel(i)}
                  aria-label="Remove"
                  isDisabled={!isDefaultReceiver && formValues.routeLabels.length <= 1}
                  variant="plain"
                  data-test-id="remove-routing-label"
                >
                  <MinusCircleIcon />
                </Button>
              </Tooltip>
            </div>
          </div>
        );
      })}
      <div
        className={classNames(
          'form-group',
          {
            'has-error': formValues.routeLabelDuplicateNamesError,
          },
          'co-routing-label-editor__error-message',
        )}
      >
        <span className="help-block">
          {formValues.routeLabelDuplicateNamesError ? (
            <span data-test-id="duplicate-label-name-error">
              Routing label names must be unique.
            </span>
          ) : (
            ''
          )}
        </span>
      </div>
      {!isDefaultReceiver && (
        <Button
          className="pf-m-link--align-left"
          onClick={addRoutingLabel}
          type="button"
          variant="link"
          data-test-id="add-routing-label"
        >
          <PlusCircleIcon className="co-icon-space-r" />
          Add
        </Button>
      )}
    </div>
  );
};
