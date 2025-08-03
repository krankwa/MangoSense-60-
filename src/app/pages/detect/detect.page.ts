import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { DetectionService } from '../../services/detection.service';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-detect',
  templateUrl: './detect.page.html',
  styleUrls: ['./detect.page.scss'],
  standalone: false
})
export class DetectPage implements OnInit {

  constructor(
    private router: Router,
    private detectionService: DetectionService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
  }

  async takePhoto() {
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

  async selectFromGallery() {
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

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}
