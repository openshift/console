import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FieldLevelHelp, Alert } from 'patternfly-react';

import { k8sPatch, k8sGet, referenceFor, referenceForOwnerRef } from '../module/k8s';
import { PromiseComponent, NameValueEditorPair, EnvType, EnvFromPair, LoadingBox, AsyncComponent, ContainerDropdown, ResourceLink } from './utils';
import { ConfigMapModel, SecretModel } from '../models';

/**
 * Set up an AsyncComponent to wrap the name-value-editor to allow on demand loading to reduce the
 * vendor footprint size.
 */
const NameValueEditorComponent = (props) => <AsyncComponent loader={() => import('./utils/name-value-editor.jsx').then(c => c.NameValueEditor)} {...props} />;
const EnvFromEditorComponent = (props) => <AsyncComponent loader={() => import('./utils/name-value-editor.jsx').then(c => c.EnvFromEditor)} {...props} />;

/**
 * Set up initial value for the environment vars state. Use this in constructor or cancelChanges.
 *
 * Our return value here is an object in the form of:
 * {
 *   env: [[envname, value, id],[...]]
 *   envFrom: [[envFromprefix, resourceObject, id], [...]]
 * }
 *
 *
 * @param initialPairObjects
 * @returns {*}
 * @private
 */
const getPairsFromObject = (element) => {
  let returnedPairs = {};
  if (_.isNil(element.env)) {
    returnedPairs.env = [['', '', 0]];
  } else {
    returnedPairs.env = _.map(element.env, (leafNode, i) => {
      if (!_.has(leafNode, 'value') && !_.has(leafNode, 'valueFrom')) {
        leafNode.value = '';
      }
      leafNode.ID = i;
      return Object.values(leafNode);
    });
  }
  if (_.isNil(element.envFrom)) {
    const configMapSecretRef = {name: '', key: ''};
    returnedPairs.envFrom = [['', {configMapSecretRef}, 0]];
  } else {
    returnedPairs.envFrom = _.map(element.envFrom, (leafNode, i) => {
      if (!_.has(leafNode, 'prefix')) {
        leafNode.prefix = '';
      }
      leafNode.ID = i;
      return [leafNode.prefix, _.pick(leafNode, ['configMapRef', 'secretRef']), leafNode.ID];
    });
  }
  return returnedPairs;
};

/**
 * Get name/value pairs from an array or object source
 *
 * @param initialPairObjects
 * @returns {Array}
 */
const envVarsToArray = (initialPairObjects) => {
  const cpOfInitialPairs = _.cloneDeep(initialPairObjects);
  if (_.isArray(cpOfInitialPairs)) {
    return _.map(cpOfInitialPairs, (element) => {
      const { env, envFrom } = getPairsFromObject(element);
      return [env, envFrom];
    });
  }
  const { env, envFrom } = getPairsFromObject(cpOfInitialPairs);
  return [[env, envFrom]];
};

/** @type {(state: any, props: {obj: object, rawEnvData: any, readOnly: boolean, envPath: any}) => {model: K8sKind}} */
const stateToProps = ({k8s}, {obj}) => ({
  model: k8s.getIn(['RESOURCES', 'models', referenceFor(obj)]) || k8s.getIn(['RESOURCES', 'models', obj.kind]),
});

export const EnvironmentPage = connect(stateToProps)(
  class EnvironmentPage extends PromiseComponent {
  /**
   * Set initial state and decide which kind of env we are setting up
   *
   * @param props
   */
    constructor(props) {
      super(props);

      this.reload = this._reload.bind(this);
      this.saveChanges = this._saveChanges.bind(this);
      this.updateEnvVars = this._updateEnvVars.bind(this);
      this.selectContainer = this._selectContainer.bind(this);

      const currentEnvVars = envVarsToArray(this.props.rawEnvData);
      this.state = {
        currentEnvVars,
        success: null,
        containerKey: 0
      };
    }

    componentDidMount() {
      super.componentDidMount();

      const {readOnly} = this.props;
      if (readOnly) {
        const configMaps = {}, secrets = {};
        this.setState({configMaps, secrets});
        return;
      }
      const envNamespace = _.get(this.props, 'obj.metadata.namespace');

      Promise.all([
        k8sGet(ConfigMapModel, null, envNamespace).catch((err) => {
          if (err.response.status !== 403) {
            const errorMessage = err.message || 'Could not load config maps.';
            this.setState({errorMessage});
          }
          return {
            configMaps: {}
          };
        }),
        k8sGet(SecretModel, null, envNamespace).catch((err) => {
          if (err.response.status !== 403) {
            const errorMessage = err.message || 'Could not load secrets.';
            this.setState({errorMessage});
          }
          return {
            secrets: {}
          };
        })
      ])
        .then(_.spread((configMaps, secrets) => this.setState({configMaps, secrets})));
    }

    /**
     * Return env var pairs in name value notation, and strip out any pairs that have empty NAME values.
     *
     *
     * @param finalEnvPairs
     * @returns {Array}
     * @private
     */
    _envVarsToNameVal(finalEnvPairs) {
      return _.filter(finalEnvPairs, finalEnvPair => !_.isEmpty(finalEnvPair[NameValueEditorPair.Name]))
        .map(finalPairForContainer => {
          if (finalPairForContainer[NameValueEditorPair.Value] instanceof Object) {
            return {
              'name': finalPairForContainer[NameValueEditorPair.Name],
              'valueFrom': finalPairForContainer[NameValueEditorPair.Value]
            };
          }
          return {
            'name': finalPairForContainer[NameValueEditorPair.Name],
            'value': finalPairForContainer[NameValueEditorPair.Value]
          };
        });
    }

    /**
     * Return env var pairs in envFrom (resource/prefix) notation, and strip out any pairs that have empty resource values.
     *
     *
     * @param finalEnvPairs
     * @returns {Array}
     * @private
     */
    _envFromVarsToResourcePrefix(finalEnvPairs) {
      return _.filter(finalEnvPairs, finalEnvPair => (!_.isEmpty(finalEnvPair[EnvFromPair.Resource]) && !finalEnvPair[EnvFromPair.Resource].configMapSecretRef))
        .map(finalPairForContainer => {
          return _.assign({'prefix': finalPairForContainer[EnvFromPair.Prefix]}, finalPairForContainer[EnvFromPair.Resource]);
        });
    }

    /**
     * Callback for NVEditor update our state with new values
     * @param env
     * @param i
     */
    _updateEnvVars(env, i = 0, type = EnvType.ENV) {
      const {rawEnvData} = this.props;
      const {currentEnvVars} = this.state;
      const currentEnv = currentEnvVars;
      currentEnv[i][type] = env.nameValuePairs;
      const modified = !_.isEqual(currentEnv, envVarsToArray(rawEnvData));
      this.setState({
        currentEnvVars: currentEnv,
        success: null,
        modified,
      });
    }

    /**
     * Reset the page to initial state
     * @private
     */
    _reload() {
      const {rawEnvData} = this.props;
      this.setState({
        currentEnvVars: envVarsToArray(rawEnvData),
        errorMessage: null,
        success: null,
        modified: false,
        stale: false
      });
    }

    /**
     * Build out our currentEnvVars state object from our incoming props.
     * If there is a change and are read/write let the user know we have updated vars otherwise just refresh the page.
     * For no change return null
     *
     * @param nextProps
     * @param prevState
     */
    static getDerivedStateFromProps(nextProps, prevState) {
      const { currentEnvVars } = prevState;
      const { rawEnvData, readOnly } = nextProps;
      const incomingEnvVars = envVarsToArray(rawEnvData);
      if (_.isEqual(incomingEnvVars, currentEnvVars)) {
        return null;
      }
      return readOnly ? {currentEnvVars: incomingEnvVars} : {stale: true, success: null};
    }

    _selectContainer(index) {
      this.setState({containerKey: parseInt(index, 10)});
    }

    /**
     * Make it so. Patch the values for the env var changes made on the page.
     * 1. Validate for dup keys
     * 2. Throw out empty rows
     * 3. Use add command if we are adding new env vars, and replace if we are modifying
     * 4. Send the patch command down to REST, and update with response
     *
     * @param e
     */
    _saveChanges(e) {
      const {envPath, rawEnvData, obj, model} = this.props;
      const {currentEnvVars} = this.state;
      e.preventDefault();

      const envPatch = currentEnvVars.map((finalPairsForContainer, i) => {
        const op = 'add';
        const path = _.isArray(rawEnvData) ? `/${envPath.join('/')}/${i}/env` : `/${envPath.join('/')}/env`;

        return {path, op, value: this._envVarsToNameVal(finalPairsForContainer[EnvType.ENV])};
      });

      const envFromPatch = currentEnvVars.map((finalPairsForContainer, i) => {
        const op = 'add';
        const path = _.isArray(rawEnvData) ? `/${envPath.join('/')}/${i}/envFrom` : `/${envPath.join('/')}/envFrom`;

        return {path, op, value: this._envFromVarsToResourcePrefix(finalPairsForContainer[EnvType.ENV_FROM])};
      });
      const promise = k8sPatch(model, obj, _.concat(envPatch, envFromPatch));
      this.handlePromise(promise).then((res) => {
        const newEnvData = _.get(res, envPath);
        this.setState({
          success: 'Successfully updated the environment variables.',
          errorMessage: null,
          currentEnvVars: envVarsToArray(newEnvData),
          modified: false,
          stale: false
        });
      });
    }

    render() {
      const {errorMessage, success, inProgress, currentEnvVars, stale, configMaps, secrets, containerKey} = this.state;
      const {rawEnvData, readOnly, obj} = this.props;
      const isContainerArray = _.isArray(rawEnvData);
      const containerDropdown = <ContainerDropdown
        currentKey={containerKey}
        containers={rawEnvData}
        onChange={this.selectContainer} />;

      if (!configMaps || !currentEnvVars || !secrets) {
        return <LoadingBox />;
      }
      const envVar = currentEnvVars[containerKey];
      const owners = _.get(obj.metadata, 'ownerReferences', [])
        .map((o, i) => <ResourceLink key={i} kind={referenceForOwnerRef(o)} name={o.name} namespace={obj.metadata.namespace} title={o.uid} />);
      const resourceName = _.get(obj.metadata, 'name', '');
      const containerVars =
        <React.Fragment>
          { readOnly &&
            <div className="co-toolbar__group co-toolbar__group--left">
              <Alert className="col-md-11 col-xs-10" type="info">Environment variables for {resourceName} were set from the resource {owners.length > 1 ? 'owners' : 'owner'}: <span className="environment-resource-link">{owners}</span>
              </Alert>
            </div>
          }
          { isContainerArray && <div className="co-toolbar__group co-toolbar__group--left">
            <div className="co-toolbar__item">Container:</div>
            <div className="co-toolbar__item">{containerDropdown}</div>
          </div>
          }
          <div className="co-m-pane__body-group">
            <h3 className="co-section-heading-tertiary">Single values (env)
              {
                !readOnly && <FieldLevelHelp content={
                  <div>Define environment variables as key-value pairs to store configuration settings. You can enter text or add values from a ConfigMap or Secret. Drag and drop environment variables to change the order in which they are run. A variable can reference any other variables that come before it in the list, for example <code>FULLDOMAIN = $(SUBDOMAIN).example.com</code>.</div>} />
              }
            </h3>
            <NameValueEditorComponent nameValueId={containerKey} nameValuePairs={envVar[EnvType.ENV]} updateParentData={this.updateEnvVars} addString="Add Value" nameString="Name" readOnly={readOnly} allowSorting={true} configMaps={configMaps} secrets={secrets} />
          </div>
          { isContainerArray && <div className="co-m-pane__body-group environment-buttons">
            <h3 className="co-section-heading-tertiary">All values from existing config maps or secrets (envFrom) {
              !readOnly && <FieldLevelHelp content={
                <div>Add new values by referencing an existing config map or secret. Drag and drop environment variables within this section to change the order in which they are run.<br /><strong>Note: </strong>If identical values exist in both lists, the single value in the list above will take precedence.</div>} />
            }
            </h3>
            <EnvFromEditorComponent nameValueId={containerKey} nameValuePairs={envVar[EnvType.ENV_FROM]} updateParentData={this.updateEnvVars} readOnly={readOnly} configMaps={configMaps} secrets={secrets} />
          </div>}
        </React.Fragment>;

      return <div className="co-m-pane__body">
        {containerVars}
        <div className="co-m-pane__body-group">
          <div className="environment-buttons">
            {errorMessage && <p className="alert alert-danger"><span className="pficon pficon-error-circle-o" aria-hidden="true"></span>{errorMessage}</p>}
            {stale && <p className="alert alert-info"><span className="pficon pficon-info" aria-hidden="true"></span>The
              information on this page is no longer current. Click Reload to update and lose edits, or Save Changes to
              overwrite.</p>}
            {success &&
            <p className="alert alert-success"><span className="pficon pficon-ok" aria-hidden="true"></span>{success}
            </p>}
            {!readOnly &&
            <button disabled={inProgress} type="submit" className="btn btn-primary" onClick={this.saveChanges}>Save
              Changes</button>}
            {!readOnly && <button disabled={inProgress} type="button" className="btn btn-default" onClick={this.reload}>Reload</button>}
          </div>
        </div>
      </div>;
    }
  });
EnvironmentPage.propTypes = {
  obj: PropTypes.object.isRequired,
  rawEnvData: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  envPath: PropTypes.array.isRequired,
  readOnly: PropTypes.bool.isRequired
};
