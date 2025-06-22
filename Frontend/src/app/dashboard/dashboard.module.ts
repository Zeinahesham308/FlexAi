import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { UserProfileHeaderComponent } from './components/user-profile-header/user-profile-header.component';
import { WorkoutDayCardComponent } from './components/workout-day-card/workout-day-card.component';
import { ExerciseCardComponent } from './components/exercise-card/exercise-card.component';
import { ProgressChartComponent } from './components/progress-chart/progress-chart.component';
import { SettingsModalComponent } from './components/settings-modal/settings-modal.component';

import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { WorkoutPlanNavigatorComponent } from './components/workout-plan-navigator/workout-plan-navigator.component';


@NgModule({
  declarations: [
    DashboardComponent,
    UserProfileHeaderComponent,
    WorkoutDayCardComponent,
    ExerciseCardComponent,
    ProgressChartComponent,
    SettingsModalComponent,
    WorkoutPlanNavigatorComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MatIconModule,
    FormsModule,
  ],
  exports: [
    UserProfileHeaderComponent,
    WorkoutDayCardComponent,
    ExerciseCardComponent,
    ProgressChartComponent,
    SettingsModalComponent,
    WorkoutPlanNavigatorComponent,
    DashboardComponent,
  ]
})
export class DashboardModule { }
