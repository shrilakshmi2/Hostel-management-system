import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeWardenComponent } from './employee-warden.component';

describe('EmployeeWardenComponent', () => {
  let component: EmployeeWardenComponent;
  let fixture: ComponentFixture<EmployeeWardenComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmployeeWardenComponent]
    });
    fixture = TestBed.createComponent(EmployeeWardenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
