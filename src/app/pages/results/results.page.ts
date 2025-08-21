import { Component, OnInit } from '@angular/core';
import { IonicModule, LoadingController, ToastController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { VerifyModalComponent } from './verify-modal.component';
import { ApiService, LocationData } from 'src/app/services/apiservice.service';

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
  imageFile: File | null = null;
  mainDisease: string = '';
  probabilities: any[] = [];
  diseaseInfo: string = '';
  treatment: string = '';
  confidenceLevel: string = '';
  confidenceScore: number = 0;
  savedImageId: number | null = null;
  locationData: LocationData | null = null;
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
    'Stem end Rot': [
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
    private modalCtrl: ModalController,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    // Debug: Log everything about the navigation state
    console.log('🔍 Full window object keys:', Object.keys(window));
    console.log('🔍 Window.history:', window.history);
    console.log('🔍 Window.history.state:', window.history.state);
    console.log('🔍 Router state (if available):', (this.router as any).getCurrentNavigation?.()?.extras?.state);
    
    const navState = window.history.state;
    console.log('🔍 Full navigation state received:', navState);
    console.log('🔍 Navigation state type:', typeof navState);
    console.log('🔍 Navigation state is null:', navState === null);
    console.log('🔍 Navigation state keys:', navState ? Object.keys(navState) : 'N/A');
    
    this.result = navState?.result || null;
    this.image = navState?.image || null;
    this.imageFile = navState?.imageFile || null;
    
    console.log('🔍 Results page initialized with:', {
      hasResult: !!this.result,
      hasImage: !!this.image,
      hasImageFile: !!this.imageFile,
      resultData: this.result,
      resultSuccess: this.result?.success,
      resultDataExists: !!this.result?.data,
      primaryPredictionExists: !!this.result?.data?.primary_prediction,
      imageType: typeof this.image,
      imageFileType: typeof this.imageFile
    });
    
    // If no result, let's try to get it from other sources
    if (!this.result) {
      console.log('❌ No result found in navigation state, checking alternative sources...');
      
      // Try to get from router state
      const navigation = (this.router as any).getCurrentNavigation?.();
      if (navigation?.extras?.state) {
        console.log('🔍 Found router navigation state:', navigation.extras.state);
        this.result = navigation.extras.state.result;
        this.image = navigation.extras.state.image;
        this.imageFile = navigation.extras.state.imageFile;
      }
      
      // Try localStorage as fallback
      const storedResult = localStorage.getItem('lastAnalysisResult');
      const storedImage = localStorage.getItem('lastAnalysisImage');
      if (storedResult && !this.result) {
        console.log('🔍 Found stored result in localStorage');
        try {
          this.result = JSON.parse(storedResult);
          this.image = storedImage;
        } catch (e) {
          console.error('❌ Failed to parse stored result:', e);
        }
      }
    }
    
    if (!this.result) {
      console.error('❌ No result found anywhere');
      this.showToast('No result found. Please analyze a photo first.');
      this.router.navigate(['pages/home']);
      return;
    }
    
    if (!this.result.success) {
      console.error('❌ Result indicates failure:', this.result);
      this.showToast('Analysis failed: ' + (this.result.error || this.result.message || 'Unknown error'));
      this.router.navigate(['pages/home']);
      return;
    }
    
    if (!this.image) {
      console.error('❌ No image found');
      // Don't redirect for missing image, modal can still work
      console.log('⚠️ Continuing without image data...');
    }
    
    console.log('✅ All required data present, processing results...');
    this.processResults();
  }

  processResults() {
    console.log('🔄 Processing results...', this.result);
    
    if (!this.result) {
      console.error('❌ No result to process');
      return;
    }
    
    if (!this.result.success) {
      console.error('❌ Result indicates failure:', this.result);
      this.showToast('Prediction failed: ' + (this.result.error || this.result.message || 'Unknown error'));
      return;
    }

    const predictionData = this.result.data || this.result;
    console.log('🔍 Prediction data structure:', predictionData);
    console.log('🔍 Has primary_prediction:', !!predictionData.primary_prediction);
    
    if (predictionData.primary_prediction) {
      console.log('✅ Primary prediction found, extracting data...');
      
      // Extract all the data
      this.mainDisease = predictionData.primary_prediction.disease;
      this.treatment = predictionData.primary_prediction.treatment;
      this.confidenceScore = predictionData.primary_prediction.confidence_score || 0;
      this.savedImageId = predictionData.saved_image_id || 0;
      
      console.log('🔍 Extracted basic data:', {
        mainDisease: this.mainDisease,
        treatment: this.treatment,
        confidenceScore: this.confidenceScore,
        savedImageId: this.savedImageId
      });
      
      this.probabilities = predictionData.top_3_predictions?.map((pred: any) => ({
        class: pred.disease,
        confidence: pred.confidence,
        confidence_formatted: pred.confidence_formatted,
        treatment: pred.treatment,
        rank: pred.rank
      })) || [];
      
      this.confidenceLevel = predictionData.prediction_summary?.confidence_level || 'Unknown';
      this.diseaseInfo = this.getDiseaseInfo(this.mainDisease);
      
      console.log('🔍 Final extracted data:', {
        mainDisease: this.mainDisease,
        confidenceScore: this.confidenceScore,
        savedImageId: this.savedImageId,
        confidenceLevel: this.confidenceLevel,
        probabilitiesCount: this.probabilities.length,
        diseaseInfo: this.diseaseInfo
      });
      
      console.log('✅ Successfully processed results, opening verification modal...');
      
      // Show verification modal after processing results
      this.openVerificationModal();
      
    } else {
      console.error('❌ Unexpected response format - no primary_prediction:', this.result);
      console.error('❌ Available keys in result:', Object.keys(this.result));
      console.error('❌ Available keys in predictionData:', Object.keys(predictionData));
      
      this.mainDisease = 'Unknown Disease';
      this.diseaseInfo = 'Unable to determine disease from the image';
      this.probabilities = [];
      this.showToast('Unexpected response format from server.');
      
      // Even for errors, set as verified to show something
      this.isVerified = true;
    }
  }

    async openVerificationModal() {
    console.log('🎯 Opening verification modal...');
    
    try {
      const indications = this.indicationsMap[this.mainDisease] || [];
      console.log('🔍 Indications for', this.mainDisease, ':', indications);
      
      // Try to extract location data from image file
      let locationData: LocationData | null = null;
      if (this.imageFile) {
        console.log('📍 Attempting to extract location data from image file...');
        try {
          locationData = await this.apiService.extractLocationFromImageWithFallback(this.imageFile);
          console.log('📍 Location extraction result:', locationData);
        } catch (error) {
          console.error('📍 Location extraction failed:', error);
        }
      } else {
        console.log('📍 No image file available for location extraction');
      }

      const modalProps = {
        mainDisease: this.mainDisease, 
        indications: indications,
        imageFile: this.imageFile,
        locationData: locationData,
        result: this.result,
        imageId: this.savedImageId || 0,
        confidenceScore: this.confidenceScore || 0,
        confidenceLevel: this.confidenceLevel
      };

      console.log('🎯 Creating modal with props:', modalProps);

      const modal = await this.modalCtrl.create({
        component: VerifyModalComponent,
        componentProps: modalProps,
        cssClass: 'verify-modal-custom',
        backdropDismiss: false // Prevent dismissing by clicking backdrop
      });
      
      console.log('🎯 Modal created, presenting...');
      await modal.present();
      console.log('🎯 Modal presented successfully');

      const { data } = await modal.onWillDismiss();
      console.log('🎯 Modal dismissed with data:', data);
      
      // Always set as verified after modal dismissal
      this.isVerified = true;
      
      if (data?.verified) {
        this.verificationResult = data.isCorrect;
        
        // Check for errors first
        if (data.error) {
          console.warn('⚠️ Verification completed with error:', data.error);
          this.showToast(data.error);
        } else {
          console.log('✅ Verification completed successfully');
          const message = data.isCorrect ? 
            'Thank you for confirming the AI prediction!' : 
            'Thank you for the feedback. This helps improve our AI accuracy.';
          this.showToast(message);
        }
        
        if (data.confirmationId) {
          console.log('✅ Confirmation saved with ID:', data.confirmationId);
        }
        
        if (data.locationSaved) {
          console.log('📍 Location data was saved with the confirmation');
        }
      } else if (data?.skipped) {
        console.log('⏭️ User skipped verification');
        this.showToast('Verification skipped');
      } else if (data?.cancelled) {
        console.log('❌ User cancelled verification');
      }
      
    } catch (error) {
      console.error('💥 Error opening verification modal:', error);
      this.showToast('Error opening verification dialog. Please try again.');
      this.isVerified = true; // Set as verified to show results anyway
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
      'Stem end Rot': 'A post-harvest disease that affects fruits at the stem end, causing rot and reducing storage life.'
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
