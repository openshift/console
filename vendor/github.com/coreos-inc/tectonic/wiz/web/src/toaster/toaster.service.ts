import {
  Injectable
} from '@angular/core';

export interface Toast {
  type: string;
  text: string;
}

@Injectable()
export class ToasterService {
  toasts: Toast[] = [];

  error(text: string): void {
    this.toasts.push({
      type: 'error',
      text
    });
  }

  dismiss(toast: Toast): void {
    const indexOf: number = this.toasts.indexOf(toast);
    if (indexOf >= 0) {
      this.toasts.splice(indexOf, 1);
    }
  }
}
