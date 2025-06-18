import { Component, OnInit } from '@angular/core';
import { UserProfile } from '../../../models/user.interface';
import { UserAccountInfoService } from '../../../services/user.account.info.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-profile-header',
  standalone: false,

  templateUrl: './user-profile-header.component.html',
  styleUrl: './user-profile-header.component.scss'
})
export class UserProfileHeaderComponent implements OnInit {

  // Default profile image if avatarUrl is missing
  defaultAvatar = 'assets/images/user-avatar-test.png';


  // This will be populated with user data from the backend (Default values for initialization)
  userData: UserProfile = {
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

  constructor(private userAccountInfoService: UserAccountInfoService, private authService: AuthService) { }
  ngOnInit(): void {
    const userId = this.authService.getStoredUserId(); //TODO: Replace with actual user ID logic
    this.userAccountInfoService.getUserAccount(userId).subscribe({
      next: (user: UserProfile) => {
        this.userData = user;
      },
      error: (err) => {
        console.error('Error fetching user data:', err);
      }
    });
  }

}
