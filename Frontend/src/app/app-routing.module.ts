import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { ChatbotComponent } from './chatbot/chatbot.component';
import { StreamlitEmbedComponent } from './streamlit-embed/streamlit-embed.component';

const routes: Routes = [
  { path: '', redirectTo: 'default', pathMatch: 'full' }, // Default route redirects to Sign Up/ Sign In
  { path: 'home', component: HomePageComponent },
  { path: 'default', component: SignUpComponent }, // Sign Up page route
  { path: 'Streamlit-chatbot', component: StreamlitEmbedComponent },
  { path: 'chatbot', component: ChatbotComponent },
  { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule) },
  { path: '**', redirectTo: '/signup' } // Wildcard route for invalid paths (redirect to Sign Up/ Sign In)

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }


