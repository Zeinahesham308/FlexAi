import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkoutDayCardComponent } from './workout-day-card.component';

describe('WorkoutDayCardComponent', () => {
  let component: WorkoutDayCardComponent;
  let fixture: ComponentFixture<WorkoutDayCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkoutDayCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkoutDayCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
