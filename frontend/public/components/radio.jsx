import * as React from 'react';

export const RadioInput = (props) => {
  const inputProps = _.omit(props, ['title', 'subTitle', 'desc', 'children']);
  return <div className="radio-item">
    <label>
      <input type="radio" {...inputProps} />
      {props.title} { props.subTitle && <span className="co-no-bold">{props.subTitle}</span>}
    </label>
    {props.desc && <p className="co-m-radio-desc text-muted">{props.desc}</p>}
    {props.children}
  </div>;
};
RadioInput.propTypes = {
  children: React.PropTypes.node,
  desc: React.PropTypes.node,
  title: React.PropTypes.node.isRequired,
};

export const RadioGroup = ({currentValue, onChange, items}) => <div>
  {items.map(({desc, title, value}) => <RadioInput
    key={value}
    checked={value === currentValue}
    desc={desc}
    onChange={onChange}
    title={title}
    value={value}
  />)}
</div>;
