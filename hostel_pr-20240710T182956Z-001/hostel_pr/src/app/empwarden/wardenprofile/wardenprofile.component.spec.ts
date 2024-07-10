import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WardenprofileComponent } from './wardenprofile.component';

describe('WardenprofileComponent', () => {
  let component: WardenprofileComponent;
  let fixture: ComponentFixture<WardenprofileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WardenprofileComponent]
    });
    fixture = TestBed.createComponent(WardenprofileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
