import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true, 
  imports: [IonicModule, CommonModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  userName: string = 'User';
  currentTime: string = '';
  userAvatar: string = '';
  selectedDetectionType: string | null = null; // 'leaf' or 'fruit'
  
  // Statistics
  totalAnalyses: number = 0;
  healthyCount: number = 0;
  diseaseCount: number = 0;
  recentAnalysesCount: number = 0;
  
  // Weather data (mock for now)
  weatherData: any = null;

  constructor(
    private router: Router, 
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.updateTimeGreeting();
    this.loadStatistics();
    this.loadWeatherData();
  }

  ionViewWillEnter() {
    this.loadUserData();
    this.updateTimeGreeting();
    this.loadStatistics();
  }

  selectDetectionType(type: 'leaf' | 'fruit') {
    this.selectedDetectionType = type;
  }
  clearSelection() {
    this.selectedDetectionType = null;
  }

  private loadUserData() {
    const userData = localStorage.getItem('user_data');
    const authToken = localStorage.getItem('auth_token');
    
    console.log('Stored user data:', userData);
    console.log('Auth token exists:', !!authToken);
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('Parsed user object:', user);
        
        this.userName = user.firstName || 
                       user.first_name || 
                       user.name || 
                       user.username || 
                       user.displayName ||
                       'User';
        
        this.userAvatar = user.avatar || user.profileImage || '';
        
        console.log('Final userName:', this.userName);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.userName = 'User';
      }
    } else {
      console.log('No user data found in localStorage');
      this.userName = 'User';
    }
  }

  private updateTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.currentTime = 'Good Morning';
    } else if (hour < 17) {
      this.currentTime = 'Good Afternoon';
    } else {
      this.currentTime = 'Good Evening';
    }
  }

  private loadStatistics() {
    // Load from localStorage or API
    const stats = localStorage.getItem('analysis_stats');
    if (stats) {
      try {
        const data = JSON.parse(stats);
        this.totalAnalyses = data.total || 0;
        this.healthyCount = data.healthy || 0;
        this.diseaseCount = data.diseases || 0;
        this.recentAnalysesCount = data.recent || 0;
      } catch (error) {
        console.error('Error loading statistics:', error);
      }
    }
  }

  private loadWeatherData() {
    // Mock weather data - replace with actual API call
    this.weatherData = {
      temperature: 28,
      description: 'Partly Cloudy',
      location: 'Your Farm',
      humidity: 65,
      pressure: 1013
    };
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getTimeIcon(): string {
    const hour = new Date().getHours();
    if (hour < 6 || hour > 20) return 'moon-outline';
    if (hour < 12) return 'sunny-outline';
    if (hour < 18) return 'partly-sunny-outline';
    return 'moon-outline';
  }

  async openProfile() {
    // Navigate to profile or open modal
    this.router.navigate(['/folder/Settings']);
  }

  async importPhoto() {
    if (!this.selectedDetectionType) return;
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });
      const imageData = 'data:image/jpeg;base64,' + image.base64String;
      this.router.navigate(['/pages/verify'], { 
        state: { 
          image: imageData,
          detectionType: this.selectedDetectionType 
        } 
      });
    } catch (err) {
      await this.showToast('Photo import cancelled or failed.', 'warning');
    }
  }

  async useCamera() {
    if (!this.selectedDetectionType) return;
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      const imageData = 'data:image/jpeg;base64,' + image.base64String;
      this.router.navigate(['/pages/verify'], { 
        state: { 
          image: imageData,
          detectionType: this.selectedDetectionType 
        } 
      });
    } catch (err) {
      await this.showToast('Camera cancelled or failed.', 'warning');
    }
  }

  navigateToHistory() {
    this.router.navigate(['/folder/History']);
  }

  navigateToReports() {
    this.router.navigate(['/folder/Reports']);
  }

  navigateToMap() {
    this.router.navigate(['/folder/Map']);
  }

  navigateToTips() {
    this.router.navigate(['/folder/Tips']);
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({ 
      message, 
      duration: 3000, 
      color,
      position: 'bottom',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}