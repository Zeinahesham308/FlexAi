import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CalendarDay } from '../../../models/calendar-day.interface';
import { Workouts } from '../../../models/workouts.interface';

@Component({
  selector: 'app-fitness-calendar',
  standalone: false,

  templateUrl: './fitness-calendar.component.html',
  styleUrl: './fitness-calendar.component.scss'
})

export class FitnessCalendarComponent implements OnInit {


  @Input() workouts: Workouts[] = [];
  @Input() initialDate?: Date;

  @Output() dayClicked = new EventEmitter<Date>();
  @Output() monthChanged = new EventEmitter<Date>();


  currentDate = new Date();
  selectedDate = new Date(); // Track selected date
  days: CalendarDay[] = [];   // Array of days for desktop view
  weekDays: CalendarDay[] = []; // Array of days for mobile view
  readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Add animation state variable
  animationDirection: 'left' | 'right' | null = null;

  get gridClasses(): string {
    let classes = 'days-grid';

    if (this.animationDirection === 'left') {
      classes += ' slide-out-left';
    } else if (this.animationDirection === 'right') {
      classes += ' slide-out-right';
    } else if (this.animationDirection === null) {
      classes += ' slide-in';
    }

    return classes;
  }

  ngOnInit(): void {
    this.initializeDate();
    this.generateCalendar();
    this.generateWeekDays();
  }


  private initializeDate() {
    this.currentDate = this.initialDate ?? new Date();
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    this.days = [];

    // Previous month days
    for (let i = firstDay.getDay(); i > 0; i--) {
      this.addCalendarDay(new Date(year, month, -i + 1), false);
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      this.addCalendarDay(new Date(year, month, i), true);
    }

    // Next month days
    const daysNeeded = 42 - this.days.length; // Complete 6 weeks
    for (let i = 1; i <= daysNeeded; i++) {
      this.addCalendarDay(new Date(year, month + 1, i), false);
    }

    this.monthChanged.emit(this.currentDate);
  }

  // Generate week days for mobile view
  generateWeekDays(): void {
    const today = new Date();
    this.weekDays = [];

    // Process 7 days centered around today
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
      this.addCalendarDay(date, isCurrentMonth, this.weekDays);
    }
  }

  private addCalendarDay(date: Date, isCurrentMonth: boolean, targetArray?: CalendarDay[]) {

    const day: CalendarDay = {
      date,
      isCurrentMonth,
      workouts: this.getWorkoutsForDate(date),
      isToday: this.isToday(date)
    };
    // If targetArray is provided, push to that array, otherwise push to this.days
    if (targetArray) {
      targetArray.push(day);
    }
    else {
      this.days.push(day);
    }
  }
  // Date utilities
  public isToday(date: Date): boolean {
    return this.isSameDate(date, new Date());
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  private getWorkoutsForDate(date: Date): Workouts[] {
    return this.workouts.filter(workout => {
      this.isSameDate(new Date(workout.date), date);
    });
  }

  // Navigation
  async previousMonth(): Promise<void> {
    // Trigger exit animation
    this.animationDirection = 'left';
    // Wait for exit animation to partially complete
    await this.delay(150);
    this.changeMonth(-1);
  }

  async nextMonth(): Promise<void> {
    // Trigger exit animation
    this.animationDirection = 'left';
    // Wait for exit animation to partially complete
    await this.delay(150);
    this.changeMonth(1);
  }

  private changeMonth(offset: number): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + offset,
      1
    );
    this.generateCalendar();
    // Reset animation state
    this.animationDirection = null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  onDayClick(day: CalendarDay) {
    console.log('Selected day:', day);
    // Emit to parent or handle navigation
    if (day.isCurrentMonth) {
      this.selectedDate = day.date;
      this.dayClicked.emit(day.date);
    }
  }

  areAllWorkoutsCompleted(workouts: Workouts[]): boolean {
    return workouts.length > 0 && workouts.every(workout => workout.completed);
  }

  // Desktop day classes
  getDayClasses(day: CalendarDay): string {
    let classes = 'day-cell';
    if (day.isCurrentMonth) classes += ' current-month';
    else classes += ' other-month';
    if (day.isToday) classes += ' today';
    if (day.workouts?.length) classes += ' has-workouts';
    if (this.isSameDate(day.date, this.selectedDate)) classes += ' selected';
    return classes;
  }

  // Mobile day classes
  getMobileDayClass(day: CalendarDay): string {
    let classes = 'day-item';
    if (day.isToday) classes += ' today';
    if (this.isSameDate(day.date, this.selectedDate)) classes += ' selected';
    if (day.workouts?.length) classes += ' has-workouts';
    return classes;
  }



}
