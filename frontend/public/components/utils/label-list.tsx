import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { Label as PfLabel, LabelGroup as PfLabelGroup } from '@patternfly/react-core';

/* eslint-disable import/named */
import { withTranslation, WithTranslation } from 'react-i18next';
/* eslint-enable import/named */
import { K8sResourceKindReference, kindForReference } from '../../module/k8s';

export const Label: React.SFC<LabelProps> = ({ kind, name, value, expand }) => {
  const href = `/search?kind=${kind}&q=${value ? encodeURIComponent(`${name}=${value}`) : name}`;
  const kindOf = `co-m-${kindForReference(kind.toLowerCase())}`;
  const klass = classNames(kindOf, { 'co-m-expand': expand }, 'co-label');

  return (
    <>
      <PfLabel className={klass} isTruncated>
        <Link className="pf-c-label__content" to={href}>
          <span className="co-label__key" data-test="label-key">
            {name}
          </span>
          {value && <span className="co-label__eq">=</span>}
          {value && <span className="co-label__value">{value}</span>}
        </Link>
      </PfLabel>
    </>
  );
};

class TranslatedLabelList extends React.Component<LabelListProps> {
  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps, this.props);
  }

  render() {
    const { labels, kind, t, expand = true } = this.props;
    const list = _.map(labels, (label, key) => (
      <Label key={key} kind={kind} name={key} value={label} expand={expand} />
    ));

    return (
      <>
        {_.isEmpty(list) ? (
          <div className="text-muted" key="0">
            {t('public~No labels')}
          </div>
        ) : (
          <PfLabelGroup
            className="co-label-group"
            defaultIsOpen={true}
            numLabels={20}
            data-test="label-list"
          >
            {list}
          </PfLabelGroup>
        )}
      </>
    );
  }
}

export const LabelList = withTranslation()(TranslatedLabelList);

export type LabelProps = {
  kind: K8sResourceKindReference;
  name: string;
  value: string;
  expand: boolean;
};

export type LabelListProps = WithTranslation & {
  labels: { [key: string]: string };
  kind: K8sResourceKindReference;
  expand?: boolean;
};
