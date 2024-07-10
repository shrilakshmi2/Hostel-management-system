import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WardenhomeComponent } from './wardenhome.component';

describe('WardenhomeComponent', () => {
  let component: WardenhomeComponent;
  let fixture: ComponentFixture<WardenhomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WardenhomeComponent]
    });
    fixture = TestBed.createComponent(WardenhomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
