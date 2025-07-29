import { Component, OnInit } from '@angular/core';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-verify',
  standalone: true, 
  imports: [IonicModule, CommonModule],
  templateUrl: './verify.page.html',
  styleUrls: ['./verify.page.scss'],
})
export class VerifyPage implements OnInit {
  image: string | null = null;
  isProcessing = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    const nav = window.history.state;
    this.image = nav.image || null;
    
    if (!this.image) {
      this.showToast('No image provided. Please take or select a photo.', 'warning');
      this.goBack();
    }
  }

  goBack() {
    this.router.navigate(['/pages/home']);
  }

  async confirm() {
  if (!this.image) {
    this.showToast('No image to process.', 'warning');
    return;
  }

  if (this.isProcessing) {
    return;
  }

  this.isProcessing = true;
  const loading = await this.loadingCtrl.create({ 
    message: 'Analyzing mango disease...',
    spinner: 'crescent'
  });
  await loading.present();

  try {
    // Convert base64 to blob
    const base64 = this.image.replace(/^data:image\/[a-z]+;base64,/, '');
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // Create FormData
    const formData = new FormData();
    formData.append('image', blob, 'image.jpg');

    const apiUrl = environment.apiUrl.replace(/\/$/, '');

    // Remove Content-Type header to let browser set it automatically for multipart/form-data
    this.http.post(apiUrl, formData).subscribe({
      next: async (result) => {
        await loading.dismiss();
        this.isProcessing = false;
        this.router.navigate(['/pages/results'], { 
          state: { 
            result,
            image: this.image 
          } 
        });
      },
      error: async (err) => {
        await loading.dismiss();
        this.isProcessing = false;
        console.error('Detection error:', err);
        
        let errorMessage = 'Analysis failed. Please try again.';
        if (err.status === 0) {
          errorMessage = 'Cannot connect to server. Please check your connection.';
        } else if (err.status === 415) {
          errorMessage = 'Image format not supported. Please try a different image.';
        } else if (err.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        this.showToast(errorMessage, 'danger');
      }
    });
  } catch (error) {
    await loading.dismiss();
    this.isProcessing = false;
    console.error('Image processing error:', error);
    this.showToast('Failed to process image. Please try again.', 'danger');
  }
}

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'danger') {
    const toast = await this.toastCtrl.create({ 
      message, 
      duration: 3000, 
      color,
      position: 'top',
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