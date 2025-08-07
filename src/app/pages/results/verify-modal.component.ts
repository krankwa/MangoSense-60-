import { Component, Input } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService as MainApiService, UserConfirmation } from 'src/app/services/api.service';
import { ApiService as UtilApiService, LocationData } from 'src/app/services/apiservice.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-verify-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-title>Verify AI Detection Result</ion-title>
      <ion-buttons slot="end">
        <ion-button (click)="dismiss()">
          <ion-icon name="close"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding" style="--background: linear-gradient(135deg, #f9f9d5 0%, #e8f5e8 100%);">
    <div style="max-width: 400px; margin: 16px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 24px 20px; text-align: center;">
      
      <!-- AI Detection Result -->
      <ion-icon name="leaf-outline" size="large" style="color: #457800; font-size: 48px; margin-bottom: 12px;"></ion-icon>
      <h2 style="font-size: 1.4rem; font-weight: 700; color: #457800; margin-bottom: 8px;">{{ mainDisease }}</h2>
      <p style="color: #666; font-size: 0.9rem; margin-bottom: 16px;">AI detected this disease with {{ confidenceLevel }}% confidence</p>
      
      <!-- Visual Indicators -->
      <div *ngIf="indications?.length" style="margin-bottom: 20px;">
        <div style="margin: 12px 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 1rem;">Check if you see these symptoms:</div>
        <ion-list lines="none" style="background: transparent;">
          <ion-item *ngFor="let ind of indications" style="--background: #f8f9fa; margin: 4px 0; border-radius: 8px;">
            <ion-icon name="eye-outline" slot="start" style="color: #007bff;"></ion-icon>
            <ion-label style="font-size: 0.9rem; color: #444;">{{ ind }}</ion-label>
          </ion-item>
        </ion-list>
      </div>

      <!-- Location Information -->
      <div *ngIf="locationData" style="background: #e8f5e8; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
          <ion-icon name="location-outline" style="color: #457800; margin-right: 8px;"></ion-icon>
          <span style="font-weight: 600; color: #457800;">Location Found in Image</span>
        </div>
        <p style="font-size: 0.85rem; color: #666; margin: 4px 0;">{{ locationData.address || (locationData.latitude + ', ' + locationData.longitude) }}</p>
        
        <!-- Location Consent -->
        <ion-item lines="none" style="--background: transparent; --padding-start: 0;">
          <ion-checkbox 
            [(ngModel)]="locationConsent" 
            slot="start"
            style="margin-right: 12px;">
          </ion-checkbox>
          <ion-label style="font-size: 0.85rem; color: #555;">
            Share location data to help improve disease mapping in your area
          </ion-label>
        </ion-item>
      </div>

      <!-- Optional Feedback -->
      <div style="margin-bottom: 20px;">
        <ion-textarea
          [(ngModel)]="userFeedback"
          placeholder="Optional: Add any observations or comments..."
          rows="3"
          style="--background: #f8f9fa; --color: #333; border-radius: 8px;">
        </ion-textarea>
      </div>
      
      <!-- Verification Buttons -->
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <ion-button 
          expand="block" 
          color="success" 
          (click)="verify(true)"
          style="--border-radius: 12px;">
          <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
          Yes, this is a match
        </ion-button>
        <ion-button 
          expand="block" 
          color="danger" 
          fill="outline" 
          (click)="verify(false)"
          style="--border-radius: 12px;">
          <ion-icon name="close-circle-outline" slot="start"></ion-icon>
          No, this does not match
        </ion-button>
        <ion-button 
          expand="block" 
          fill="clear" 
          color="medium" 
          (click)="skip()"
          style="font-size: 0.9rem;">
          Skip verification
        </ion-button>
      </div>
      
      <!-- Help Text -->
      <p style="font-size: 0.8rem; color: #999; margin-top: 16px; line-height: 1.4;">
        Your feedback helps improve our AI accuracy. All data is anonymized and used for research purposes only.
      </p>
    </div>
  </ion-content>
  `
})
export class VerifyModalComponent {
  @Input() mainDisease: string = '';
  @Input() indications: string[] = [];
  @Input() confidenceLevel: string = '';
  @Input() imageId: number = 0;
  @Input() confidenceScore: number = 0;
  @Input() locationData: LocationData | null = null;

  locationConsent: boolean = false;
  userFeedback: string = '';

  constructor(
    private modalCtrl: ModalController,
    private apiService: MainApiService,
    private utilApiService: UtilApiService
  ) {}

  dismiss() {
    this.modalCtrl.dismiss({ cancelled: true });
  }

  skip() {
    this.modalCtrl.dismiss({ verified: false, skipped: true });
  }

  async verify(isCorrect: boolean) {
    try {
      // Log the current state for debugging
      console.log('🔍 Verify modal state:', {
        imageId: this.imageId,
        mainDisease: this.mainDisease,
        confidenceScore: this.confidenceScore,
        locationConsent: this.locationConsent,
        hasLocationData: !!this.locationData,
        userFeedback: this.userFeedback,
        userFeedbackLength: this.userFeedback.length
      });

      // Prepare confirmation data
      const confirmationData = {
        image_id: this.imageId,
        is_correct: isCorrect,
        predicted_disease: this.mainDisease,
        user_feedback: this.userFeedback.trim(),
        confidence_score: this.confidenceScore,
        location_consent_given: this.locationConsent
      };

      // Add location data if consent given and location available
      if (this.locationConsent && this.locationData) {
        Object.assign(confirmationData, {
          latitude: this.locationData.latitude,
          longitude: this.locationData.longitude,
          location_accuracy: this.locationData.accuracy || 0,
          location_address: this.locationData.address || ''
        });
      }

      console.log('📤 Sending confirmation data:', confirmationData);
      console.log('📝 User feedback specifically:', {
        raw: this.userFeedback,
        trimmed: this.userFeedback.trim(),
        isEmpty: this.userFeedback.trim() === ''
      });

      // Save confirmation to backend
      const response = await firstValueFrom(this.apiService.saveUserConfirmation(confirmationData));
      
      if (response?.success) {
        console.log('Confirmation saved successfully:', response);
        this.modalCtrl.dismiss({ 
          verified: true, 
          isCorrect,
          confirmationId: response.data.confirmation_id,
          locationSaved: this.locationConsent && this.locationData
        });
      } else {
        console.error('Failed to save confirmation:', response);
        // Still dismiss modal but show warning
        this.modalCtrl.dismiss({ 
          verified: true, 
          isCorrect,
          error: 'Failed to save feedback to server'
        });
      }
      
    } catch (error: any) {
      console.error('Error saving confirmation:', error);
      
      let errorMessage = 'Network error while saving feedback';
      
      // Check if this is the "already exists" error
      if (error && typeof error === 'string' && error.includes('already exists')) {
        errorMessage = 'This image has already been verified. Thank you for your feedback!';
      } else if (error && error.message && error.message.includes('already exists')) {
        errorMessage = 'This image has already been verified. Thank you for your feedback!';
      } else if (error && error.error && error.error.message && error.error.message.includes('already exists')) {
        errorMessage = 'This image has already been verified. Thank you for your feedback!';
      }
      
      // Still dismiss modal but show appropriate message
      this.modalCtrl.dismiss({ 
        verified: true, 
        isCorrect,
        error: errorMessage
      });
    }
  }
}