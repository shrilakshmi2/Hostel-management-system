import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WardenmsgsComponent } from './wardenmsgs.component';

describe('WardenmsgsComponent', () => {
  let component: WardenmsgsComponent;
  let fixture: ComponentFixture<WardenmsgsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WardenmsgsComponent]
    });
    fixture = TestBed.createComponent(WardenmsgsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
