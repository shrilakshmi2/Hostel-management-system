import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WardenapplicationsComponent } from './wardenapplications.component';

describe('WardenapplicationsComponent', () => {
  let component: WardenapplicationsComponent;
  let fixture: ComponentFixture<WardenapplicationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WardenapplicationsComponent]
    });
    fixture = TestBed.createComponent(WardenapplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
