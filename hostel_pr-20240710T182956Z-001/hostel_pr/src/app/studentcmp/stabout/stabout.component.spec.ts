import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaboutComponent } from './stabout.component';

describe('StaboutComponent', () => {
  let component: StaboutComponent;
  let fixture: ComponentFixture<StaboutComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StaboutComponent]
    });
    fixture = TestBed.createComponent(StaboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
