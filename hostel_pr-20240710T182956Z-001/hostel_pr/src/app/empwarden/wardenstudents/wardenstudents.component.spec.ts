import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WardenstudentsComponent } from './wardenstudents.component';

describe('WardenstudentsComponent', () => {
  let component: WardenstudentsComponent;
  let fixture: ComponentFixture<WardenstudentsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WardenstudentsComponent]
    });
    fixture = TestBed.createComponent(WardenstudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
