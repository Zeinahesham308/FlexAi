import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FitnessCalendarComponent } from './fitness-calendar.component';

describe('FitnessCalendarComponent', () => {
  let component: FitnessCalendarComponent;
  let fixture: ComponentFixture<FitnessCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FitnessCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FitnessCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
