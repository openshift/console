import { Control } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ErrorService } from '../error/error.service';
import { Helper } from '../helper/helper';

@Component({
  selector: 'wiz-upload-file',
  templateUrl: 'app/static/src/upload-file/upload-file.component.html',
})
export class UploadFileComponent {
  @Input() id: string;
  @Input() control: Control;
  @Input() label: string;

  constructor(
    public errorService: ErrorService,
    public helper: Helper
  ) { }

  get inputId(): string {
    return 'wiz-upload-file-input-' + this.id;
  }

  uploadFile(file: File): void {
    this.helper.readFile(file)
      .then(value => (this.control as Control).updateValue(value))
      .catch(this.errorService.handle.bind(this.errorService));
  }
}
