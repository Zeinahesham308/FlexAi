import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-chart',
  standalone: false,

  templateUrl: './progress-chart.component.html',
  styleUrl: './progress-chart.component.scss'
})
export class ProgressChartComponent {
  // Required inputs
  @Input({ required: true }) completed!: number;
  @Input({ required: true }) total!: number;

  // SVG circle calculations
  readonly radius = 15.915; // SVG circle radius
  readonly circumference = 2 * Math.PI * this.radius;

  /**
   * Calculates completion percentage
   */
  get percentage(): number {
    return this.total > 0 ? Math.round((this.completed / this.total) * 100) : 0;
  }

  /**
   * Calculates SVG dashoffset for progress ring
   */
  get offset(): number {
    return this.circumference * (1 - this.completed / this.total);
  }
}
