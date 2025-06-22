import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkoutPlanNavigatorComponent } from './workout-plan-navigator.component';

describe('WorkoutPlanNavigatorComponent', () => {
  let component: WorkoutPlanNavigatorComponent;
  let fixture: ComponentFixture<WorkoutPlanNavigatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkoutPlanNavigatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkoutPlanNavigatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
