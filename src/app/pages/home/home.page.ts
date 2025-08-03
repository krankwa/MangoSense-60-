import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, ModalController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { DetectionService } from '../../services/detection.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {
  userAvatar: string = '';
  currentTime: string = 'Good Morning';
  userName: string = 'User';
  selectedDetectionType: string = '';

  constructor(
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private modalController: ModalController,
    private detectionService: DetectionService
  ) { }

  ngOnInit() {
    this.setCurrentTime();
    this.loadUserInfo();
  }

  loadUserInfo() {
    try {
      const userInfo = localStorage.getItem('userInfo') || localStorage.getItem('user_data');
      if (userInfo) {
        const userData = JSON.parse(userInfo);
        this.userName = userData.name || userData.username || userData.firstName || 'User';
      } else {
        this.userName = 'User';
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      this.userName = 'User';
    }
  }

  setCurrentTime() {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.currentTime = 'Good Morning';
    } else if (hour < 18) {
      this.currentTime = 'Good Afternoon';
    } else {
      this.currentTime = 'Good Evening';
    }
  }

  openProfile() {
    console.log('Open profile clicked');
  }

  selectDetectionType(type: string) {
    this.selectedDetectionType = type;
  }

  clearSelection() {
    this.selectedDetectionType = '';
  }

  async importPhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      if (image.dataUrl) {
        // Convert dataUrl to File for API upload
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'mango-image.jpg', { type: 'image/jpeg' });
        
        // Store the image data
        this.detectionService.setImage(image.dataUrl, file);
        
        // Navigate to verify page
        this.router.navigate(['/pages/verify']);
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      this.showToast('Error selecting image. Please try again.');
    }
  }

  async useCamera() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        // Convert dataUrl to File for API upload
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'mango-image.jpg', { type: 'image/jpeg' });
        
        // Store the image data
        this.detectionService.setImage(image.dataUrl, file);
        
        // Navigate to verify page
        this.router.navigate(['/pages/verify']);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      this.showToast('Error taking photo. Please try again.');
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }

  goToDetect() {
    this.router.navigate(['/pages/detect']);
  }

  goToHistory() {
    this.router.navigate(['/pages/history']);
  }

  goToVerify() {
    this.router.navigate(['/pages/verify']);
  }

  goToResults() {
    this.router.navigate(['/pages/results']);
  }

  goToHeatmap() {
    this.router.navigate(['/pages/heatmap']);
  }
}
