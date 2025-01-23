import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StreamlitEmbedComponent } from './streamlit-embed.component';

describe('StreamlitEmbedComponent', () => {
  let component: StreamlitEmbedComponent;
  let fixture: ComponentFixture<StreamlitEmbedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StreamlitEmbedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StreamlitEmbedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
