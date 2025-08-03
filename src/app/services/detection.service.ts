import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PredictionResult {
  primary_prediction: {
    disease: string;
    confidence: string;
    confidence_score: number;
    confidence_level: string;
    treatment: string;
    detection_type: string;
  };
  top_3_predictions: Array<{
    disease: string;
    confidence: number;
    treatment: string;
    detection_type: string;
  }>;
  prediction_summary: {
    most_likely: string;
    confidence_level: string;
    total_diseases_checked: number;
  };
  saved_image_id?: number;
  model_used: string;
}

export interface ApiResponse {
  success: boolean;
  data: PredictionResult;
  message: string;
}

export interface DetectionData {
  image: string; // base64 or blob URL
  imageFile?: File;
  predictionResult?: PredictionResult;
  isVerified?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DetectionService {
  private readonly API_URL = 'http://127.0.0.1:8000/api'; // Match environment.ts
  private detectionDataSubject = new BehaviorSubject<DetectionData | null>(null);
  
  constructor(private http: HttpClient) { }

  get detectionData$(): Observable<DetectionData | null> {
    return this.detectionDataSubject.asObservable();
  }

  get currentDetectionData(): DetectionData | null {
    return this.detectionDataSubject.value;
  }

  setImage(image: string, imageFile?: File): void {
    const currentData = this.currentDetectionData || {};
    this.detectionDataSubject.next({
      ...currentData,
      image,
      imageFile,
      isVerified: false,
      predictionResult: undefined
    });
  }

  setPredictionResult(result: PredictionResult): void {
    const currentData = this.currentDetectionData;
    if (currentData) {
      this.detectionDataSubject.next({
        ...currentData,
        predictionResult: result
      });
    }
  }

  setVerified(verified: boolean): void {
    const currentData = this.currentDetectionData;
    if (currentData) {
      this.detectionDataSubject.next({
        ...currentData,
        isVerified: verified
      });
    }
  }

  predictImage(imageFile: File): Observable<PredictionResult> {
    const formData = new FormData();
    formData.append('image', imageFile);

    // Get authorization token
    const token = localStorage.getItem('accessToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.post<ApiResponse>(`${this.API_URL}/predict/`, formData, { headers })
      .pipe(
        map(response => response.data) // Extract the data from the API response
      );
  }

  clearDetectionData(): void {
    this.detectionDataSubject.next(null);
  }

  // Helper methods to format data for display
  getMainDisease(): string {
    const result = this.currentDetectionData?.predictionResult;
    return result?.primary_prediction?.disease || '';
  }

  getConfidenceLevel(): string {
    const result = this.currentDetectionData?.predictionResult;
    // Use the pre-formatted confidence string from API, or format the score if needed
    if (result?.primary_prediction?.confidence) {
      return result.primary_prediction.confidence;
    } else if (result?.primary_prediction?.confidence_score) {
      return `${result.primary_prediction.confidence_score.toFixed(1)}%`;
    }
    return '';
  }

  getTopProbabilities(count: number = 3): Array<{name: string, confidence: number}> {
    const result = this.currentDetectionData?.predictionResult;
    if (!result?.top_3_predictions) return [];

    return result.top_3_predictions
      .slice(0, count)
      .map(prediction => ({ 
        name: prediction.disease, 
        confidence: prediction.confidence 
      }));
  }

  getTreatment(): string {
    const result = this.currentDetectionData?.predictionResult;
    return result?.primary_prediction?.treatment || '';
  }

  getConfidenceLevelText(): string {
    const result = this.currentDetectionData?.predictionResult;
    return result?.primary_prediction?.confidence_level || '';
  }

  formatConfidence(confidence: number): string {
    // Confidence is already a percentage value, just format to 1 decimal place
    return `${confidence.toFixed(1)}%`;
  }
}
