import { Component, OnInit } from '@angular/core';
import { IonicModule, LoadingController, ToastController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment'; // Adjust the path as necessary
import { VerifyModalComponent } from './verify-modal.component';

@Component({
  selector: 'app-results',
  standalone: true, 
  imports: [IonicModule, CommonModule],
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.scss'],
})
export class ResultsPage implements OnInit {
  result: any = null;
  image: string | null = null;
  mainDisease: string = '';
  probabilities: any[] = [];
  diseaseInfo: string = '';
  treatment: string = '';
  confidenceLevel: string = '';
  isLoading = false;
  isVerified = false;
  verificationResult: boolean | null = null;

  indicationsMap: { [key: string]: string[] } = {
    'Anthracnose': [
      'Do you see dark, sunken spots on the leaves or fruits?',
      'Are there soft, rotten areas on the fruit?',
      'Are the tips of the leaves turning brown?'
    ],
    'Bacterial Canker': [
      'Are there wounds or sores on the branches or stems?',
      'Are some leaves wilting or drying up?',
      'Are small branches dying from the tip?'
    ],
    'Cutting Weevil': [
      'Are the young shoots or leaves damaged or cut?',
      'Do you see small holes in the stems?',
      'Are some parts of the plant wilting or not growing well?'
    ],
    'Die Back': [
      'Are the ends of branches drying up and dying?',
      'Is the drying moving from the tip towards the main branch?',
      'Does the plant look stressed or weak?'
    ],
    'Gall Midge': [
      'Do you see unusual swellings (galls) on leaves or shoots?',
      'Are some leaves or shoots growing in a strange or twisted way?',
      'Is the plant not growing as strong as usual?'
    ],
    'Healthy': [
      'Are the leaves and fruits looking normal?',
      'Do you see no spots, wounds, or strange growths?',
      'Is the plant growing well and strong?'
    ],
    'Powdery Mildew': [
      'Do you see white, powder-like patches on the leaves or stems?',
      'Are the leaves looking dull or dusty?',
      'Is the fruit not growing well or looking unhealthy?'
    ],
    'Sooty Mold': [
      'Do you see black, soot-like dirt on the leaves or fruits?',
      'Are the leaves sticky or dirty to touch?',
      'Is the plant not as green as usual?'
    ],
    'Black Mold Rot': [
      'Do you see black mold growing on the fruits?',
      'Are the fruits soft and spoiling quickly?',
      'Are there black, rotten spots on the fruit?'
    ],
    'Stem End Rot': [
      'Is the area where the fruit joins the stem soft or rotten?',
      'Do you see water-soaked or dark spots at the stem end of the fruit?',
      'Are the fruits spoiling from the stem side?'
    ]
  };

  constructor(
    private router: Router,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    // Get the image from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.image = navigation.extras.state['image'];
    } else {
      // Fallback to window.history.state
      this.image = window.history.state?.image;
    }

    console.log('Received image:', this.image);

    if (this.image) {
      this.callPredictAPI();
    } else {
      this.showToast('No image found. Please go back and take a photo.');
    }
  }

  async callPredictAPI() {
    if (!this.image) {
      this.showToast('No image to process.');
      return;
    }

    this.isLoading = true;
    this.mainDisease = 'Analyzing...';
    
    const loading = await this.loadingCtrl.create({ 
      message: 'Analyzing your mango image...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Convert base64 to blob
      const base64Data = this.image.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');

      const apiUrl = 'http://127.0.0.1:8000/api/predict/';
      //const apiUrl = `${(environment as any).apiUrl}/predict/`;

      this.http.post(apiUrl, formData)
        .pipe(
          finalize(async () => {
            this.isLoading = false;
            await loading.dismiss();
          })
        )
        .subscribe({
          next: (result: any) => {
            console.log('API Response:', result);
            this.result = result;
            this.processResults();
          },
          error: (error: HttpErrorResponse) => {
            console.error('API error:', error);
            this.handleError(error);
          }
        });

    } catch (error) {
      await loading.dismiss();
      this.isLoading = false;
      console.error('Processing error:', error);
      this.showToast('Error processing image. Please try again.');
    }
  }

  processResults() {
    console.log('Processing results:', this.result);
    
    // Check if the API call was successful
    if (!this.result.success) {
      this.showToast('Prediction failed: ' + (this.result.error || 'Unknown error'));
      return;
    }

    // Extract data from the correct Django backend response format
    if (this.result.primary_prediction) {
      // Main disease from primary prediction
      this.mainDisease = this.result.primary_prediction.disease;
      this.treatment = this.result.primary_prediction.treatment;
      
      // Get top 3 predictions for probabilities display
      this.probabilities = this.result.top_3_predictions.map((pred: any) => ({
        class: pred.disease,
        confidence: pred.confidence,
        confidence_formatted: pred.confidence_formatted,
        treatment: pred.treatment,
        rank: pred.rank
      }));
      
      // Confidence level from prediction summary
      this.confidenceLevel = this.result.prediction_summary.confidence_level;
      
      // Get disease info
      this.diseaseInfo = this.getDiseaseInfo(this.mainDisease);
      
      console.log('Successfully processed results:');
      console.log('Main disease:', this.mainDisease);
      console.log('Confidence level:', this.confidenceLevel);
      console.log('Top 3 predictions:', this.probabilities);
      
      // Show verify modal automatically if not verified
      if (!this.isVerified) {
        this.openVerificationModal();
      }
    } else {
      // Fallback for unexpected response format
      console.error('Unexpected response format:', this.result);
      this.mainDisease = 'Unknown Disease';
      this.diseaseInfo = 'Unable to determine disease from the image';
      this.probabilities = [];
      this.showToast('Unexpected response format from server');
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred. Please try again.';
    
    if (error.status === 0) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    } else if (error.status === 400) {
      errorMessage = 'Invalid image format. Please try another image.';
    } else if (error.status === 413) {
      errorMessage = 'Image too large. Please use a smaller image.';
    } else if (error.status === 500) {
      errorMessage = error.error?.error || 'Server error occurred. Please try again.';
    }

    this.showToast(errorMessage);
    this.mainDisease = 'Analysis Failed';
    this.diseaseInfo = 'Unable to analyze the image. Please try again.';
  }

  getTopProbabilities() {
    // Already sorted by rank from backend, just return first 3
    return this.probabilities.slice(0, 3);
  }

  getDiseaseInfo(disease: string): string {
    const diseaseInfoMap: { [key: string]: string } = {
      'Anthracnose': 'A fungal disease that causes dark, sunken spots on leaves and fruits. It thrives in warm, humid conditions and can significantly reduce fruit quality.',
      'Bacterial Canker': 'A bacterial infection that causes cankers on stems and branches, leading to wilting and dieback. Early detection is crucial for management.',
      'Cutting Weevil': 'An insect pest that damages young shoots and leaves. The larvae bore into stems, causing wilting and stunted growth.',
      'Die Back': 'A disease that causes branch tips to die back progressively, often starting from the ends. It can be caused by various pathogens or environmental stress.',
      'Gall Midge': 'Small fly larvae that cause galls on leaves and shoots, leading to deformed growth and reduced plant vigor.',
      'Healthy': 'No disease detected - your mango plant appears healthy! Continue with regular care and monitoring.',
      'Powdery Mildew': 'A fungal disease that causes white, powdery coating on leaves and shoots. It can reduce photosynthesis and fruit quality.',
      'Sooty Mold': 'Black fungal growth that develops on honeydew secreted by insects. While not directly harmful, it reduces photosynthesis.',
      'Black Mold Rot': 'A fungal infection that causes black mold growth on fruits, leading to rapid deterioration and spoilage.',
      'Stem End Rot': 'A post-harvest disease that affects fruits at the stem end, causing rot and reducing storage life.'
    };

    return diseaseInfoMap[disease] || `Information about ${disease} is being researched. Please consult with agricultural experts for specific guidance.`;
  }

  formatConfidence(confidence: number): string {
    // Confidence from backend is already a percentage number (e.g., 85.67)
    return `${confidence.toFixed(1)}%`;
  }

  goBack() {
    this.router.navigate(['pages/home']);
  }

  retakePhoto() {
    this.router.navigate(['pages/home']);
  }
  
  async openVerificationModal() {
    const indications = this.indicationsMap[this.mainDisease] || [];
    const modal = await this.modalCtrl.create({
      component: VerifyModalComponent,
      componentProps: { mainDisease: this.mainDisease, indications: indications },
      cssClass: 'verify-modal-custom'
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.verified) {
      this.isVerified = true;
      this.verificationResult = data.isCorrect;
      if (data.isCorrect) {
        this.showToast('Thank you for verifying!', 'success');
      } else {
        this.showToast('Thank you for your feedback!', 'warning');
      }
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'danger') {
    const toast = await this.toastCtrl.create({ 
      message, 
      duration: 4000, 
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
