import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { DetectionService, DetectionData } from '../../services/detection.service';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.page.html',
  styleUrls: ['./verify.page.scss'],
  standalone: false
})
export class VerifyPage implements OnInit {
  imageData: string | null = null;
  detectionData: DetectionData | null = null;

  constructor(
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private detectionService: DetectionService
  ) { }

  ngOnInit() {
    // Get current detection data
    this.detectionData = this.detectionService.currentDetectionData;
    this.imageData = this.detectionData?.image || null;
    
    // If no image data, redirect back to detect page
    if (!this.imageData) {
      this.router.navigate(['/pages/detect']);
    }
  }

  goBack() {
    this.router.navigate(['/pages/detect']);
  }

  async confirm() {
    if (!this.detectionData?.imageFile) {
      this.showToast('No image data available');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Analyzing image...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Call the prediction API
      const result = await this.detectionService.predictImage(this.detectionData.imageFile).toPromise();
      
      if (result) {
        // Store the prediction result
        this.detectionService.setPredictionResult(result);
        this.detectionService.setVerified(true);
        
        // Navigate to results page
        await loading.dismiss();
        this.router.navigate(['/pages/results']);
      }
    } catch (error) {
      console.error('Error predicting image:', error);
      await loading.dismiss();
      this.showToast('Error analyzing image. Please try again.');
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
