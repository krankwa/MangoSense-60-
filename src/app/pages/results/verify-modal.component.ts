import { Component, Input } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-modal',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-title>Verify Result</ion-title>
      <ion-buttons slot="end">
        <ion-button (click)="dismiss()">
          <ion-icon name="close"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding" style="--background: linear-gradient(135deg, #f9f9d5 0%, #e8f5e8 100%);">
    <div style="max-width: 400px; margin: 32px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 28px 20px 20px 20px; text-align: center;">
      <ion-icon name="leaf-outline" size="large" style="color: #457800; font-size: 48px; margin-bottom: 12px;"></ion-icon>
      <h2 style="font-size: 1.4rem; font-weight: 700; color: #457800; margin-bottom: 8px;">{{ mainDisease }}</h2>
      <div *ngIf="indications?.length">
        <div style="margin: 18px 0 10px 0; font-weight: 600; color: #2c3e50;">Check if you see these on your leaf/fruit:</div>
        <ion-list lines="none">
          <ion-item *ngFor="let ind of indications" style="--background: transparent;">
            <ion-icon name="alert-circle-outline" slot="start" style="color: #ffc107;"></ion-icon>
            <ion-label style="font-size: 1rem; color: #444;">{{ ind }}</ion-label>
          </ion-item>
        </ion-list>
      </div>
      <div style="margin-top: 24px; display: flex; flex-direction: column; gap: 10px;">
        <ion-button expand="block" color="success" (click)="verify(true)">
          Yes, this is a match
        </ion-button>
        <ion-button expand="block" color="danger" fill="outline" (click)="verify(false)">
          No, this does not match
        </ion-button>
      </div>
    </div>
  </ion-content>
  `
})
export class VerifyModalComponent {
  @Input() mainDisease: string = '';
  @Input() indications: string[] = [];

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  verify(isCorrect: boolean) {
    this.modalCtrl.dismiss({ verified: true, isCorrect });
  }
}