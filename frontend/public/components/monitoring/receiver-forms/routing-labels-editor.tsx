import * as _ from 'lodash-es';
import * as React from 'react';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';
import { ExternalLink, SectionHeading } from '../../utils';

const DEFAULT_RECEIVER_LABEL = 'All (default receiver)';

export const RoutingLabelEditor = ({ formValues, dispatchFormChange, isDefaultReceiver }) => {
  const setRouteLabel = (path: string, v: any): void => {
    const labels = _.clone(formValues.routeLabels);
    _.set(labels, path.split(', '), v);
    dispatchFormChange({
      type: 'setFormValues',
      payload: {
        routeLabels: labels,
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
      },
    });
  };

  return (
    <div data-test-id="receiver-routing-labels-editor" className="form-group">
      <SectionHeading text="Routing Labels" />
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
        return (
          <div className="row form-group" key={i}>
            <div className="col-xs-10">
              <div className="row">
                <div className="col-xs-6 pairs-list__name-field">
                  <div className="form-group">
                    <input
                      type="text"
                      className="pf-c-form-control"
                      data-test-id={`label-name-${i}`}
                      onChange={onRoutingLabelChange(`${i}, name`)}
                      placeholder="Name"
                      value={routeLabel.name}
                      required
                    />
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
                    <label className="co-no-bold">
                      <input
                        type="checkbox"
                        onChange={(e) => onRoutingLabelRegexChange(e, i)}
                        checked={routeLabel.isRegex}
                      />
                      &nbsp; Regular Expression
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xs-2 pairs-list__action">
              <Button
                type="button"
                onClick={() => removeRoutingLabel(i)}
                aria-label="Remove Route Label"
                isDisabled={!isDefaultReceiver && formValues.routeLabels.length <= 1}
                variant="plain"
              >
                <MinusCircleIcon />
              </Button>
            </div>
          </div>
        );
      })}
      {!isDefaultReceiver && (
        <Button
          className="pf-m-link--align-left"
          onClick={addRoutingLabel}
          type="button"
          variant="link"
        >
          <PlusCircleIcon className="co-icon-space-r" />
          Add Label
        </Button>
      )}
    </div>
  );
};
