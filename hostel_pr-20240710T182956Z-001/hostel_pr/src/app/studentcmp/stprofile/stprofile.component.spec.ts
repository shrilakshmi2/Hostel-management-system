import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StprofileComponent } from './stprofile.component';

describe('StprofileComponent', () => {
  let component: StprofileComponent;
  let fixture: ComponentFixture<StprofileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StprofileComponent]
    });
    fixture = TestBed.createComponent(StprofileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
