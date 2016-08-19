import { Input, ViewChild, Component, DynamicComponentLoader, ViewContainerRef } from '@angular/core';
import { ErrorService } from '../error/error.service';

@Component({
  selector: 'wiz-template',
  template: '<div #placeholder></div>',
})
export class TemplateComponent {
  @Input() model: { template: string };
  @ViewChild('placeholder', { read: ViewContainerRef }) placeholder: ViewContainerRef;

  constructor(
    public componentLoader: DynamicComponentLoader,
    public errorService: ErrorService
  ) { }

  ngAfterViewInit() {
    let model = this.model;

    @Component({
      selector: 'templateRenderer',
      template: model.template,
      directives: [TemplateComponent]
    })
    class ViewRenderer {
      model: any;
    }

    this.componentLoader.loadNextToLocation(ViewRenderer, this.placeholder)
      .then(component => {
        component.instance.model = model;
      })
      .catch(this.errorService.handle.bind(this.errorService));
  }
}
