import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { UserProfileHeaderComponent } from './components/user-profile-header/user-profile-header.component';
import { FitnessCalendarComponent } from './components/fitness-calendar/fitness-calendar.component';
import { WorkoutDayCardComponent } from './components/workout-day-card/workout-day-card.component';
import { ExerciseCardComponent } from './components/exercise-card/exercise-card.component';
import { ProgressChartComponent } from './components/progress-chart/progress-chart.component';
import { QuickActionsMenuComponent } from './components/quick-actions-menu/quick-actions-menu.component';
import { SettingsModalComponent } from './components/settings-modal/settings-modal.component';

import { MatIconModule } from '@angular/material/icon';


@NgModule({
  declarations: [
    DashboardComponent,
    UserProfileHeaderComponent,
    FitnessCalendarComponent,
    WorkoutDayCardComponent,
    ExerciseCardComponent,
    ProgressChartComponent,
    QuickActionsMenuComponent,
    SettingsModalComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MatIconModule,
  ],
  exports: [
    UserProfileHeaderComponent,
    FitnessCalendarComponent,
    WorkoutDayCardComponent,
    ExerciseCardComponent,
    ProgressChartComponent,
    QuickActionsMenuComponent,
    SettingsModalComponent
  ]
})
export class DashboardModule { }
