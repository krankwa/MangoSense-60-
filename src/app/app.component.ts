import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent {
  public appPages = [
    { title: 'Home', url: '/pages/home', icon: 'home' },
    { title: 'Detect Disease', url: '/pages/detect', icon: 'camera' },
    { title: 'History', url: '/pages/history', icon: 'time' },
    { title: 'Verify', url: '/pages/verify', icon: 'checkmark-circle' },
    { title: 'Results', url: '/pages/results', icon: 'analytics' },
    { title: 'Heatmap', url: '/pages/heatmap', icon: 'map' },
  ];

  isLoggedIn: boolean = true;
  userName: string = 'User';

  constructor(private platform: Platform, private router: Router) {
    this.initializeApp();
    this.loadUserInfo();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Only run native plugins on native platforms
      if (Capacitor.isNativePlatform()) {
        StatusBar.setOverlaysWebView({ overlay: false });
        SplashScreen.hide();
      }
    });
  }

  loadUserInfo() {
    // Load user info from localStorage
    const storedUserName = localStorage.getItem('userName');
    const storedUserInfo = localStorage.getItem('userInfo');
    
    if (storedUserName) {
      this.userName = storedUserName;
    } else if (storedUserInfo) {
      try {
        const userInfo = JSON.parse(storedUserInfo);
        this.userName = userInfo.full_name || `${userInfo.firstName} ${userInfo.lastName}` || userInfo.firstName || 'User';
      } catch (error) {
        console.error('Error parsing user info:', error);
        this.userName = 'User';
      }
    }
    
    // Check if user is actually logged in
    this.isLoggedIn = localStorage.getItem('isAuthenticated') === 'true';
  }

  // Method to refresh user info after login
  refreshUserInfo() {
    this.loadUserInfo();
  }

  logout() {
    // Clear user data from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userName');
    localStorage.removeItem('isAuthenticated');
    
    // Update component state
    this.isLoggedIn = false;
    this.userName = 'User';
    
    // Redirect to login page
    this.router.navigate(['/login']);
  }
}
