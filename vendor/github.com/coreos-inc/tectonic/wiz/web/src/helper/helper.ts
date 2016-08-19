import {
  ElementRef,
  Injectable,
  Renderer,
} from '@angular/core';

@Injectable()
export class Helper {
  constructor(
    public renderer: Renderer
  ) { }

  focus(el: ElementRef): void {
    if (el && el.nativeElement) {
      this.renderer.invokeElementMethod(el.nativeElement, 'focus', []);
    }
  }

  readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      let fileReader = new FileReader();
      fileReader.readAsText(file);
      fileReader.addEventListener('load', () => resolve(fileReader.result));
      fileReader.addEventListener('error', () => reject(fileReader.error));
    });
  }
}
