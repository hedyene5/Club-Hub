import { TestBed } from '@angular/core/testing';

import { VirtualEventService } from './virtual-event.service';

describe('VirtualEventService', () => {
  let service: VirtualEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VirtualEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
