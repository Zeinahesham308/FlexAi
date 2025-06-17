import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomePageComponent } from './home-page/home-page.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { StreamlitEmbedComponent } from './streamlit-embed/streamlit-embed.component';
import { SignupFormComponent } from './features/signup-form/signup-form.component';
import { ChatbotComponent } from './chatbot/chatbot.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DashboardModule } from "./dashboard/dashboard.module";
import { MatIconModule } from '@angular/material/icon';
import { CvVideoUploadComponent } from './cv-video-upload/cv-video-upload.component';



@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    SignUpComponent,
    StreamlitEmbedComponent,
    ChatbotComponent,
    SignupFormComponent,
    CvVideoUploadComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    DashboardModule,
    MatIconModule,
],
  providers: [
    provideAnimationsAsync(),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
