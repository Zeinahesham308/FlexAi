// src/app/services/video-upload.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // Makes it available app-wide
})
export class VideoUploadService {
  // TODO: Update with your FastAPI server URL
  // Ensure CORS is enabled on the FastAPI server for this URL
  private apiUrl = 'http://localhost:8001/upload-video/'; 

  constructor(private http: HttpClient) {}

  uploadVideo(file: File): Observable<HttpEvent<any>> {
    console.log(file); // Log the file to check if it's being passed correctly
    const formData = new FormData();
    formData.append('file', file); // Key must match FastAPI's expected field name

    return this.http.post(this.apiUrl, formData, {
      reportProgress: true, // Enable progress tracking
      observe: 'events'     // Return detailed events (progress/response)
    });
  }
}