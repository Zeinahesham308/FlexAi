import { Component, Input } from '@angular/core';
import { UserProfile  } from '../../../models/user.interface';

@Component({
  selector: 'app-user-profile-header',
  standalone: false,
  
  templateUrl: './user-profile-header.component.html',
  styleUrl: './user-profile-header.component.scss'
})
export class UserProfileHeaderComponent {

  // Default profile image if avatarUrl is missing
  defaultAvatar = 'assets/images/user-avatar-test.png';

   // User data input (passed from parent component)
   @Input() user: UserProfile = {
    name: 'Guest User',
    gender: 'male',
    currentWeight: 0,
    targetWeight: 0,
    height: 0,
    goal: 'maintain weight',
    stats: {
      streak: 0,
      workoutsCompleted: 0
    }
  };

}
