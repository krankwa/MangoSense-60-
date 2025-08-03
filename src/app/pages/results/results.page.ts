import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { DetectionService, DetectionData } from '../../services/detection.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.scss'],
  standalone: false
})
export class ResultsPage implements OnInit {
  image: string | null = null;
  isVerified: boolean = false;
  mainDisease: string = '';
  confidenceLevel: string = '';
  probabilities: Array<{name: string, confidence: number}> = [];
  diseaseInfo: string = '';
  treatment: string = '';
  detectionData: DetectionData | null = null;

  constructor(
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private detectionService: DetectionService
  ) { }

  ngOnInit() {
    // Subscribe to detection data changes
    this.detectionService.detectionData$.subscribe(data => {
      this.detectionData = data;
      
      if (data && data.predictionResult) {
        this.updateDisplayData();
      } else if (!data) {
        // No detection data, redirect to detect page
        this.router.navigate(['/pages/detect']);
      }
    });
  }

  private updateDisplayData() {
    if (!this.detectionData || !this.detectionData.predictionResult) return;

    this.image = this.detectionData.image;
    this.isVerified = this.detectionData.isVerified || false;
    this.mainDisease = this.detectionService.getMainDisease();
    this.confidenceLevel = this.detectionService.getConfidenceLevel();
    this.probabilities = this.detectionService.getTopProbabilities();
    
    // Get treatment from API response instead of local mapping
    this.treatment = this.detectionService.getTreatment();
    
    // Debug logging
    console.log('Detection data:', this.detectionData);
    console.log('Prediction result:', this.detectionData.predictionResult);
    console.log('Main disease:', this.mainDisease);
    console.log('Treatment from API:', this.treatment);
    
    // Set disease info (keeping local mapping for now as fallback)
    this.setDiseaseInfo(this.mainDisease);
  }

  goBack() {
    this.router.navigate(['/pages/home']);
  }

  retakePhoto() {
    // Clear detection data and go back to detect
    this.detectionService.clearDetectionData();
    this.router.navigate(['/pages/detect']);
  }

  getTopProbabilities() {
    return this.probabilities;
  }

  formatConfidence(confidence: number): string {
    return this.detectionService.formatConfidence(confidence);
  }

  private setDiseaseInfo(disease: string) {
    // Set disease-specific information (keep local mapping for disease descriptions)
    const diseaseMap: { [key: string]: { info: string } } = {
      'Anthracnose': {
        info: 'A fungal disease that causes dark spots on fruit and leaves, leading to fruit rot.'
      },
      'Bacterial Canker': {
        info: 'A bacterial infection causing dark lesions on fruit, leaves, and stems.'
      },
      'Cutting Weevil': {
        info: 'Pest damage caused by weevil larvae boring into young shoots and branches.'
      },
      'Die Back': {
        info: 'Progressive death of shoots and branches, often due to fungal infection.'
      },
      'Gall Midge': {
        info: 'Pest causing abnormal growths (galls) on leaves and shoots.'
      },
      'Powdery Mildew': {
        info: 'Fungal disease causing white powdery coating on leaves and fruits.'
      },
      'Sooty Mould': {
        info: 'Black fungal growth on leaves and fruits, often following insect infestations.'
      },
      'Healthy': {
        info: 'The mango appears to be healthy with no visible signs of disease.'
      }
    };

    const diseaseData = diseaseMap[disease] || diseaseMap['Healthy'];
    this.diseaseInfo = diseaseData.info;
    
    // Treatment is now set from API response in updateDisplayData()
    // If no treatment from API, use fallback
    if (!this.treatment) {
      this.treatment = 'No specific treatment information available. Please consult with an agricultural expert.';
    }
  }

}
