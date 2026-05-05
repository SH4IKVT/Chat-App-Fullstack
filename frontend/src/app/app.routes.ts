import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ChatComponent } from './chat/chat.component';
import { SignupComponent } from './signup/signup.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { authGuard } from './guards/auth.guard';

export const routes = [
  { path: '', component: LoginComponent },

  // Protected
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  { path: 'user-dashboard', component: UserDashboardComponent, canActivate: [authGuard] },
  { path: 'analytics', component: AnalyticsComponent, canActivate: [authGuard] },

  // Public
  { path: 'signup', component: SignupComponent }
];