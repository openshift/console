import {angulars} from './react-wrapper';
import {DropdownMixin} from './dropdown';
import React from 'react';

export default class Cog extends DropdownMixin {

  render () {
    const onClick = (option, event) => {
      event.preventDefault();

      if (option.callback) {
        option.callback();
      }

      if (option.href) {
        angulars.$location.url(option.href);
      }

      this.hide();
    }

    let {options, size, anchor} = this.props;

    size = size || 'small';
    anchor = anchor || 'left';

    const lis = _.map(options, (o, i) => <li key={i}><a onClick={onClick.bind({}, o)}>{o.label}</a></li>);

    return (
      <div ref="dropdownElement" onClick={this.show.bind(this)} className="co-m-cog co-m-cog--anchor-{anchor}">
        <span className="co-m-cog co-m-cog__icon co-m-cog__icon--size-{size} fa fa-cog"></span>
        <ul className="co-m-cog__dropdown co-m-dropdown--dark dropdown-menu" style={{display: this.state.active ? 'block' : 'none'}}>
          {lis}
        </ul>
      </div>
    );
  }
};
