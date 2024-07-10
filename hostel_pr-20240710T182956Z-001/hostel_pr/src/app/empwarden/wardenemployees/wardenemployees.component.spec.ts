import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WardenemployeesComponent } from './wardenemployees.component';

describe('WardenemployeesComponent', () => {
  let component: WardenemployeesComponent;
  let fixture: ComponentFixture<WardenemployeesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WardenemployeesComponent]
    });
    fixture = TestBed.createComponent(WardenemployeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
