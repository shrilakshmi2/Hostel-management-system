import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SttransComponent } from './sttrans.component';

describe('SttransComponent', () => {
  let component: SttransComponent;
  let fixture: ComponentFixture<SttransComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SttransComponent]
    });
    fixture = TestBed.createComponent(SttransComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
