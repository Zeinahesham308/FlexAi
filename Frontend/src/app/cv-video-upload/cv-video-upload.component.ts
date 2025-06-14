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

  apiResponse: any = null;  // Add this to store backend response
  showResponse = false;     // Add this to toggle response visibility


  constructor(private uploadService: VideoUploadService) { }

  onFileSelected(event: any) {
    // TODO: Remove console log in production
    console.log('File selected:');
    this.selectedFile = event.target.files[0];
    this.resetUploadState();
  }

  uploadVideo() {
    // TODO: Remove console log in production
    console.log('Uploading video...');
    if (!this.selectedFile) return;

    this.uploadService.uploadVideo(this.selectedFile).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.uploadComplete = true;
          this.apiResponse = event.body;  // Store the response
          console.log('Backend response:', this.apiResponse);
        }
      },
      error: (err) => {
        console.error('Upload failed:', err);
        this.uploadProgress = 0;
      }
    });
  }

  resetUploadState() {
    this.uploadProgress = 0;
    this.uploadComplete = false;
    this.errorMessage = '';

  }

  // Toggle response visibility
  toggleResponse() {
    this.showResponse = !this.showResponse;
  }

}
