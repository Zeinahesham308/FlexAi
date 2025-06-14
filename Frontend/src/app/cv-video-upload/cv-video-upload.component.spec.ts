import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvVideoUploadComponent } from './cv-video-upload.component';

describe('CvVideoUploadComponent', () => {
  let component: CvVideoUploadComponent;
  let fixture: ComponentFixture<CvVideoUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CvVideoUploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CvVideoUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
