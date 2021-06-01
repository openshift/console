import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { ActionGroup, Button } from '@patternfly/react-core';

import { k8sGet, k8sUpdate } from '../../module/k8s';
import { RoleModel, ClusterRoleModel } from '../../models';
import { errorModal } from '../modals';
import {
  SectionHeading,
  history,
  ResourceIcon,
  resourceObjPath,
  PromiseComponent,
  ButtonBar,
  LoadingBox,
} from '../utils';
import * as k8sActions from '../../actions/k8s';

const NON_RESOURCE_VERBS = ['get', 'post', 'put', 'delete'];
const READ_VERBS = new Set(['get', 'list', 'proxy', 'redirect', 'watch']);
const READ_WRITE_VERBS = new Set(
  [...READ_VERBS].concat([
    'create',
    'delete',
    'deletecollection',
    'patch',
    'post',
    'put',
    'update',
  ]),
);

const API_VERBS = [...READ_WRITE_VERBS].filter((x) => !_.includes(NON_RESOURCE_VERBS, x));
const ALL_VERBS = [...READ_WRITE_VERBS];

const VERBS_ENUM = {
  RO: 'A-RO',
  ALL: 'A-ALL',
  CUSTOM: 'A-CUSTOM',
};

const RESOURCE_ENUM = {
  SAFE: 'R-SAFE',
  ALL: 'R-ALL',
  NON: 'R-NON',
  CUSTOM: 'R-CUSTOM',
};

const HelpText = (props) => <span className="help-text">{props.children}</span>;

const Checkbox = ({ value, checked, onChange }) => (
  <div>
    <label className="checkbox-label">
      <input
        type="checkbox"
        onChange={({ target: { checked: newChecked } }) => onChange(value, newChecked)}
        checked={!!checked}
      />
      &nbsp;&nbsp;{value}
    </label>
  </div>
);

const RadioButton = ({ name, value, label, text, onChange, activeValue }) => (
  <div>
    <label htmlFor={value} className="control-label">
      <input
        onChange={() => onChange(name, value)}
        type="radio"
        name={name}
        value={value}
        id={value}
        checked={activeValue === value}
      />
      {label}
      <br />
      <HelpText>{text}</HelpText>
    </label>
  </div>
);

const HRMinor = () => <hr className="rbac-minor" />;
const HRMajor = () => <hr className="rbac-major" />;

const stateToProps = (state) => {
  const resourceMap = state.k8s.get('RESOURCES');
  return resourceMap ? resourceMap.toObject() : {};
};

const EditRule = connect(stateToProps, { getResources: k8sActions.getResources })(
  class EditRule_ extends PromiseComponent {
    constructor(props) {
      super(props);

      this.state = Object.assign(this.state, {
        role: null,
        verbControl: VERBS_ENUM.RO,
        resourceControl: RESOURCE_ENUM.SAFE,
        verbsSet: new Set(),
        resourceSet: new Set(),
        nonResourceURLs: '',
        APIGroups: '*',
      });

      this.save = this.save.bind(this);

      this.set = (name, value) => {
        this.setState({ [name]: value });
      };

      this.isVerbSelected = (v) => this.isVerbSelected_(v);
      this.isResourceSelected = (r) => this.isResourceSelected_(r);

      this.toggleVerb = (name, checked) => this.toggleVerb_(name, checked);
      this.toggleResource = (name, checked) => this.toggleResource_(name, checked);

      this.kind = props.namespace ? RoleModel : ClusterRoleModel;
      this.getResource();
    }

    UNSAFE_componentWillMount() {
      this.props.getResources();
    }

    getResource() {
      const { name, namespace } = this.props;

      k8sGet(this.kind, name, namespace)
        .then((role) => {
          const { props } = this;
          this.setState({ role });

          if (!props.rule) {
            return;
          }

          const ruleIndex = parseInt(props.rule, 10);
          const rule = role.rules[ruleIndex];
          if (!rule) {
            return;
          }

          const state = {
            verbsSet: new Set(),
            resourceSet: new Set(),
          };

          let all = false;
          rule.verbs.forEach((v) => {
            if (v === '*') {
              all = true;
              return false;
            }
            state.verbsSet.add(v);
          });
          state.verbControl = all ? VERBS_ENUM.ALL : VERBS_ENUM.CUSTOM;

          all = false;

          if (_.has(rule, 'resources')) {
            rule.resources.forEach((r) => {
              if (r === '*') {
                all = true;
                return false;
              }
              state.resourceSet.add(r);
            });
          }

          state.resourceControl = all ? RESOURCE_ENUM.ALL : RESOURCE_ENUM.CUSTOM;
          state.APIGroups = rule.apiGroups ? rule.apiGroups.join(', ') : '';
          state.nonResourceURLs = rule.nonResourceURLs ? rule.nonResourceURLs.join(', ') : '';
          this.setState(state);
        })
        .catch(this.errorModal.bind(this));
    }

    save() {
      const { APIGroups, verbControl, resourceControl, nonResourceURLs } = this.state;
      const allResources = this.props.allResources || [];

      const rule = {
        apiGroups: APIGroups ? APIGroups.split(',') : [''],
        nonResourceURLs: nonResourceURLs ? nonResourceURLs.split(',') : [],
        verbs: verbControl === VERBS_ENUM.ALL ? ['*'] : ALL_VERBS.filter(this.isVerbSelected),
        resources:
          resourceControl === RESOURCE_ENUM.ALL
            ? ['*']
            : allResources.filter(this.isResourceSelected),
      };
      const role = _.cloneDeep(this.state.role);
      role.rules = role.rules || [];
      if (this.props.rule) {
        role.rules[this.props.rule] = rule;
      } else {
        role.rules.push(rule);
      }
      this.handlePromise(k8sUpdate(this.kind, role)).then(() => {
        history.push(`${resourceObjPath(role, this.kind.kind)}`);
      });
    }

    isVerbSelected_(v) {
      const { verbsSet, verbControl } = this.state;
      switch (verbControl) {
        case VERBS_ENUM.CUSTOM:
          return verbsSet.has(v);
        case VERBS_ENUM.RO:
          return READ_VERBS.has(v);
        case VERBS_ENUM.ALL:
          return true;
        default:
          return false;
      }
    }
    has(set, resource) {
      return set.has(resource.split('/')[0]);
    }

    isResourceSelected_(r) {
      const { adminResources } = this.props;
      const { resourceControl, resourceSet } = this.state;
      switch (resourceControl) {
        case RESOURCE_ENUM.CUSTOM:
          return resourceSet.has(r);
        case RESOURCE_ENUM.SAFE:
          return !adminResources.includes(r);
        case RESOURCE_ENUM.NON:
          return false;
        case RESOURCE_ENUM.ALL:
          return true;
        default:
          return false;
      }
    }

    setNonResourceURL(nonResourceURLs) {
      const state = { nonResourceURLs };

      if (this.state.resourceControl !== RESOURCE_ENUM.NON) {
        state.resourceControl = RESOURCE_ENUM.NON;
      }

      this.setState(state);
    }

    toggleVerb_(name, isSelected) {
      let verbsSet;

      if (this.state.verbControl === VERBS_ENUM.CUSTOM) {
        verbsSet = this.state.verbsSet;
      } else {
        verbsSet = new Set();
        ALL_VERBS.filter(this.isVerbSelected).forEach((r) => verbsSet.add(r));
      }

      if (isSelected) {
        verbsSet.add(name);
      } else {
        verbsSet.delete(name);
      }

      this.setState({ verbsSet, verbControl: VERBS_ENUM.CUSTOM });
    }

    toggleResource_(name, isSelected) {
      let resourceSet;

      if (this.state.resourceControl === RESOURCE_ENUM.CUSTOM) {
        resourceSet = this.state.resourceSet;
      } else {
        resourceSet = new Set();
        const { allResources } = this.props;
        allResources &&
          allResources.filter(this.isResourceSelected).forEach((r) => resourceSet.add(r));
      }

      if (isSelected) {
        resourceSet.add(name);
      } else {
        resourceSet.delete(name);
      }

      this.setState({ resourceSet, resourceControl: RESOURCE_ENUM.CUSTOM });
    }

    setApiGroups(APIGroups) {
      this.setState({ APIGroups });
    }

    errorModal(error) {
      const message = _.get(error, 'data.message') || error.statusText;
      errorModal({ error: message });
    }

    render() {
      const { t } = useTranslation();
      const { name, namespace, namespacedSet, safeResources, adminResources, rule } = this.props;
      const { verbControl, resourceControl, nonResourceURLs, APIGroups, role } = this.state;

      const heading =
        rule === undefined ? t('public~Create access rule') : t('public~Edit access rule');

      return (
        <div className="co-m-pane edit-rule">
          <Helmet>
            <title>{`${name} · ${heading}`}</title>
          </Helmet>
          <div className="co-m-pane__body">
            <SectionHeading text={heading} />
            <div className="row">
              <div className="col-xs-12">
                <p className="text-secondary">
                  {t(
                    'public~Each role is made up of a set of rules, which defines the type of access and resources that are allowed to be manipulated.',
                  )}
                </p>
              </div>
            </div>

            <div className="row rule-row">
              <div className="col-xs-2">
                <strong>
                  {t('public~{{kindlabel}} name', {
                    kindlabel: this.kind.labelKey ? t(this.kind.labelKey) : this.kind.label,
                  })}
                </strong>
              </div>
              <div className="col-xs-10">
                <ResourceIcon kind={this.kind.kind} className="no-margin" /> {name}
              </div>
            </div>

            {namespace && (
              <div className="row rule-row">
                <div className="col-xs-2">
                  <strong>{t('public~Namespace')}</strong>
                </div>
                <div className="col-xs-10">
                  <ResourceIcon kind="Namespace" className="no-margin" /> {namespace}
                </div>
              </div>
            )}
            <HRMajor />

            <div className="row rule-row">
              <div className="col-xs-2">
                <strong>{t('public~Type of access')}</strong>
              </div>
              <div className="col-xs-10">
                <RadioButton
                  name="verbControl"
                  activeValue={verbControl}
                  onChange={this.set}
                  value={VERBS_ENUM.RO}
                  label={t('public~Read-only (default)')}
                  text={t('public~Users can view, but not edit')}
                />
                <RadioButton
                  name="verbControl"
                  activeValue={verbControl}
                  onChange={this.set}
                  value={VERBS_ENUM.ALL}
                  label={t('public~All')}
                  text={t('public~Full access to all actions, including deletion')}
                />
                <RadioButton
                  name="verbControl"
                  activeValue={verbControl}
                  onChange={this.set}
                  value={VERBS_ENUM.CUSTOM}
                  label={t('public~Custom (advanced)')}
                  text={t('public~Granular selection of actions')}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-xs-2" />
              <div className="col-xs-10">
                <HRMinor />
                <p>
                  <strong>{t('public~Actions')}</strong>
                </p>
                <div className="newspaper-columns">
                  {(namespace ? API_VERBS : ALL_VERBS).map((verb) => (
                    <Checkbox
                      value={verb}
                      onChange={this.toggleVerb}
                      checked={this.isVerbSelected(verb)}
                      key={verb}
                    />
                  ))}
                </div>
              </div>
            </div>

            <HRMajor />

            <div className="row rule-row">
              <div className="col-xs-2">
                <strong>{t('public~Allowed resources')}</strong>
              </div>

              <div className="col-xs-10">
                <RadioButton
                  name="resourceControl"
                  activeValue={resourceControl}
                  onChange={this.set}
                  value={RESOURCE_ENUM.SAFE}
                  label={t('public~Recommended (default)')}
                  text={t('public~Curated resources ideal for most users')}
                />

                <RadioButton
                  name="resourceControl"
                  activeValue={resourceControl}
                  onChange={this.set}
                  value={RESOURCE_ENUM.ALL}
                  label={t('public~All access')}
                  text={t('public~Full access, including admin resources')}
                />

                <RadioButton
                  name="resourceControl"
                  activeValue={resourceControl}
                  onChange={this.set}
                  value={RESOURCE_ENUM.CUSTOM}
                  label={t('public~Custom')}
                  text={t('public~Granular selection of resources')}
                />

                {!namespace && (
                  <div>
                    <RadioButton
                      name="resourceControl"
                      activeValue={resourceControl}
                      onChange={this.set}
                      value={RESOURCE_ENUM.NON}
                      label={t('public~Non-resource URLs')}
                      text={t('public~API URLs that do not correspond to objects')}
                    />
                    <HelpText>
                      <input
                        type="text"
                        value={nonResourceURLs}
                        className="pf-c-form-control text-input"
                        onChange={(e) => this.setNonResourceURL(e.target.value)}
                        placeholder={t(
                          'public~Comma separated list of non-resource URLs (/apis/extensions/v1beta1)',
                        )}
                      />
                    </HelpText>
                  </div>
                )}
              </div>
            </div>

            <div className="row">
              <div className="col-xs-2" />
              <div className="col-xs-10">
                <HRMinor />
                <p>
                  <strong>{t('public~Safe resources')}</strong>
                </p>
                <div className="newspaper-columns">
                  {safeResources ? (
                    safeResources
                      .filter((r) => (namespace ? namespacedSet.has(r) : true))
                      .map((r) => (
                        <Checkbox
                          value={r}
                          onChange={this.toggleResource}
                          checked={this.isResourceSelected(r)}
                          key={r}
                        />
                      ))
                  ) : (
                    <LoadingBox />
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-xs-2" />
              <div className="col-xs-10">
                <HRMinor />
                <p>
                  <strong>{t('public~Admin resources')}</strong>
                </p>
                <div className="newspaper-columns">
                  {adminResources ? (
                    adminResources
                      .filter((r) => (namespace ? namespacedSet.has(r) : true))
                      .map((r) => (
                        <Checkbox
                          value={r}
                          onChange={this.toggleResource}
                          checked={this.isResourceSelected(r)}
                          key={r}
                        />
                      ))
                  ) : (
                    <LoadingBox />
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-xs-2" />
              <div className="col-xs-10">
                <HRMinor />
                <label htmlFor="api-groups">{t('public~API groups')}</label>
                <p className="text-secondary">
                  {t(
                    "public~Restrict this role to a subset of API URLs that don't correspond to objects.",
                  )}
                </p>

                <div>
                  <input
                    id="api-groups"
                    type="text"
                    value={APIGroups}
                    className="pf-c-form-control text-input"
                    onChange={(e) => this.setApiGroups(e.target.value)}
                    placeholder={t(
                      'public~Comma separated list of the api groups for the selected resources.',
                    )}
                  />
                </div>
              </div>
            </div>

            <HRMajor />

            <div className="row">
              <div className="col-xs-12">
                <ButtonBar
                  errorMessage={this.state.errorMessage}
                  inProgress={this.state.inProgress}
                >
                  <ActionGroup className="pf-c-form">
                    <Button type="submit" variant="primary" onClick={this.save}>
                      {t('public~Save')}
                    </Button>
                    {role && (
                      <Button type="button" variant="secondary" onClick={history.goBack}>
                        {t('public~Cancel')}
                      </Button>
                    )}
                  </ActionGroup>
                </ButtonBar>
              </div>
            </div>
          </div>
        </div>
      );
    }
  },
);

export const EditRulePage = ({ match: { params } }) => (
  <EditRule name={params.name} namespace={params.ns} rule={params.rule} />
);
