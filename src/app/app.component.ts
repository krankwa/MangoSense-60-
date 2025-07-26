import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false, // Set to false if you are using this component in a module
})
export class AppComponent implements OnInit {
  userName: string = '';
  userAvatar: string = '';
  currentTimeGreeting: string = '';
  
  public appPages = [
    { title: 'Home', url: 'pages/home', icon: 'home', badge: null },
    { title: 'Analysis History', url: '/folder/History', icon: 'time', badge: null },
    { title: 'Disease Reports', url: '/folder/Reports', icon: 'bar-chart', badge: 'New' },
    { title: 'Growing Tips', url: '/folder/Tips', icon: 'bulb', badge: null },
    { title: 'Settings', url: '/folder/Settings', icon: 'settings', badge: null },
    { title: 'Help & Support', url: '/folder/Help', icon: 'help-circle', badge: null }
  ];

  constructor(
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.updateTimeGreeting();
  }

  private loadUserData() {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.userName = user.firstName || user.name || 'User';
        this.userAvatar = user.avatar || '';
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }

  private updateTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.currentTimeGreeting = 'Good Morning!';
    } else if (hour < 17) {
      this.currentTimeGreeting = 'Good Afternoon!';
    } else {
      this.currentTimeGreeting = 'Good Evening!';
    }
  }

  openProfile() {
    this.router.navigate(['/folder/Settings']);
  }

  async logout() {
    try {
      // Clear stored data
      localStorage.removeItem('user_data');
      localStorage.removeItem('auth_token');
      
      // Show confirmation toast
      const toast = await this.toastCtrl.create({
        message: 'You have been logged out successfully',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
      
      // Navigate to login page
      this.router.navigate(['/pages/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
