import { Component, Input, ViewContainerRef, DynamicComponentLoader, OnInit, ViewChild } from '@angular/core';
import { ControlGroup } from '@angular/common';
import { ErrorService } from '../error/error.service';
import { Wizard } from './models';
import { BaseField } from '../fields/models';

declare var System;

@Component({
  selector: 'wiz-dynamic-field',
  template: '<div #dynamicFieldContainer></div>',
})
export class DynamicFieldComponent implements OnInit {
  @Input() wizard: Wizard;
  @Input() wizField: BaseField<any>;
  @Input() controlGroup: ControlGroup;
  @Input() autofocus: boolean;
  @ViewChild('dynamicFieldContainer', { read: ViewContainerRef }) _container: ViewContainerRef;

  constructor(
    public componentLoader: DynamicComponentLoader,
    public errorService: ErrorService
  ) { }

  ngOnInit() {
    if (!this.controlGroup) {
      return;
    }

    this.loadComponent()
      .then(compClass => this.componentLoader.loadNextToLocation(compClass, this._container))
      .then(comp => {
        comp.instance['wizard'] = this.wizard;
        comp.instance['fieldModel'] = this.wizField;
        comp.instance['control'] = this.controlGroup.controls[this.wizField.id];
        comp.instance['autofocus'] = this.autofocus;
        return comp;
      })
      .catch(this.errorService.handle.bind(this.errorService));
  }

  loadComponent() {
    let field = this.wizField;
    if (!field || !field.path) {
      return;
    }

    // TODO: maybe instead just pre-import all the things and get the exported class by name.
    return System.import(field.path)
      .then(componentModule => componentModule[field.componentType])
      .catch(this.errorService.handle.bind(this.errorService));
  }
}
