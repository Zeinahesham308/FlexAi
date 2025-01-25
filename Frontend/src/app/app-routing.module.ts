import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { ChatbotComponent } from './chatbot/chatbot.component';

const routes: Routes = [
  { path: '', redirectTo: 'default', pathMatch: 'full' }, // Default route redirects to Sign Up/ Sign In
  { path: 'home', component: HomePageComponent },
  { path: 'default', component: SignUpComponent }, // Sign Up page route
  { path: 'chatbot', component: ChatbotComponent },
  { path: '**', redirectTo: '/signup' } // Wildcard route for invalid paths (redirect to Sign Up/ Sign In)

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }


