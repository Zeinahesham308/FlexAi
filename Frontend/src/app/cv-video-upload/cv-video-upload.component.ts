import { Component } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { VideoUploadService } from '../services/video-upload.service';

@Component({
  selector: 'app-cv-video-upload',
  standalone: false,
  templateUrl: './cv-video-upload.component.html',
  styleUrl: './cv-video-upload.component.scss'
})
export class CvVideoUploadComponent {
  selectedFile: File | null = null;
  uploadProgress = 0;
  uploadComplete = false;
  errorMessage = '';
  selectedWorkoutType: string = '';

  workoutTypes = [
    { name: 'Squat' },
    { name: 'Lat Pull Down' },
    { name: 'Lateral Raises' },
    { name: 'Pull Up' },
    { name: 'Push Up' },
    { name: 'Shoulder Press' },
    { name: 'Curls' },
    { name: 'Over Head Extension' }
  ];

  apiResponse: any = null;  // Stores backend response
  isLoading = false;       // To track loading state

  constructor(private uploadService: VideoUploadService) { }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.resetUploadState();
  }

  getWorkoutName(name: string): string {
    const workout = this.workoutTypes.find(w => w.name === name);
    return workout ? workout.name : 'Unknown';
  }

  onWorkoutTypeChange() {
    console.log('Selected workout:', this.selectedWorkoutType);
  }

  uploadVideo() {
    if (!this.selectedFile || !this.selectedWorkoutType) return;

    this.resetUploadState();
    this.isLoading = true;

    this.uploadService.uploadVideo(this.selectedFile, this.selectedWorkoutType).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.handleUploadSuccess(event.body.message);
        }
      },
      error: (err) => {
        this.handleUploadError(err);
      }
    });
  }

  private handleUploadSuccess(response: any) {
    this.uploadComplete = true;
    this.isLoading = false;
    this.apiResponse = response;  // Store the entire response object
    this.resetFileSelection();
    console.log('Upload successful:', response);
  }

  private handleUploadError(err: any) {
    console.error('Upload failed:', err);
    this.uploadProgress = 0;
    this.isLoading = false;
    this.errorMessage = err.error?.message || 'An error occurred during upload';
    this.apiResponse = null;
  }

  resetUploadState() {
    this.uploadProgress = 0;
    this.uploadComplete = false;
    this.errorMessage = '';
    this.apiResponse = null;
    this.isLoading = false;
  }

  private resetFileSelection(): void {
    // Reset file input to allow selecting the same file again if needed
    this.selectedFile = null;
   /*  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    } */
  }
}