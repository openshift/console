import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';

export const RadioInput: React.SFC<RadioInputProps> = (props) => {
  const inputProps: React.InputHTMLAttributes<any> = _.omit(props, ['title', 'subTitle', 'desc', 'children', 'inline']);
  const inputElement = <React.Fragment>
    <label className={classNames({'radio-inline': props.inline, 'co-disabled': props.disabled})}>
      <input type="radio" {...inputProps} />
      {props.title} {props.subTitle && <span className="co-no-bold">{props.subTitle}</span>}
    </label>
    {props.desc && <p className="co-m-radio-desc text-muted">{props.desc}</p>}
    {props.children}
  </React.Fragment>;

  return props.inline ? inputElement : <div className="radio">{inputElement}</div>;

};

export const RadioGroup: React.SFC<RadioGroupProps> = ({currentValue, onChange, items}) => <div>
  {items.map(({desc, title, subTitle, value, disabled}) => <RadioInput
    key={value}
    checked={value === currentValue}
    desc={desc}
    onChange={onChange}
    title={title}
    subTitle={subTitle}
    value={value}
    disabled={disabled}
  />)}
</div>;

export type RadioInputProps = {
  checked: boolean;
  desc?: string | JSX.Element;
  onChange: (v: any) => void;
  subTitle?: string | JSX.Element;
  value: any;
  disabled?: boolean;
  inline?: boolean;
} & React.InputHTMLAttributes<any>;

export type RadioGroupProps = {
  currentValue: any;
  onChange: React.InputHTMLAttributes<any>['onChange'];
  items: ({
    desc?: string | JSX.Element;
    title: string | JSX.Element;
    subTitle?: string | JSX.Element;
    value: any;
    disabled?: boolean;
  } & React.InputHTMLAttributes<any>)[];
};

RadioInput.displayName = 'RadioInput';
RadioGroup.displayName = 'RadioGroup';
