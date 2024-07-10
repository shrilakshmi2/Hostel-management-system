import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WardenroomstComponent } from './wardenroomst.component';

describe('WardenroomstComponent', () => {
  let component: WardenroomstComponent;
  let fixture: ComponentFixture<WardenroomstComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WardenroomstComponent]
    });
    fixture = TestBed.createComponent(WardenroomstComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
