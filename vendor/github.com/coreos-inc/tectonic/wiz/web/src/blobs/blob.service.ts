import { Injectable } from '@angular/core';
import { BLOBS } from './mocks';

@Injectable()
export class BlobService {
  list() {
    return Promise.resolve(BLOBS);
  }

  get(id: string) {
    return Promise.resolve(BLOBS)
      .then(ps => ps.filter(p => p.id === id)[0])
  }

}
