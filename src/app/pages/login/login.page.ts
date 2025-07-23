import { Component, OnInit } from '@angular/core';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Add this method that your HTML template is calling
  async login() {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      this.showToast('Please fill all fields correctly.', 'danger');
      return;
    }

    if (this.isSubmitting) {
      return; // Prevent multiple submissions
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({ 
      message: 'Signing you in...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      //const apiUrl = `${environment.apiUrl}/login/`;
      const apiUrl = 'http://127.0.0.1:8000/api/login/';

      this.http.post(apiUrl, this.loginForm.value, { headers }).subscribe({
        next: async (response: any) => {
          await loading.dismiss();
          this.isSubmitting = false;
          
          if (response.success) {
            // Store user data
            localStorage.setItem('userToken', response.token || '');
            localStorage.setItem('userName', response.user?.name || 'User');
            
            this.showToast('Login successful!', 'success');
            this.router.navigate(['/pages/home']);
          } else {
            this.showToast(response.message || 'Login failed');
          }
        },
        error: async (err) => {
          await loading.dismiss();
          this.isSubmitting = false;
          console.error('Login error:', err);
          
          let errorMessage = 'Login failed. Please try again.';
          if (err.status === 401) {
            errorMessage = 'Invalid email or password.';
          } else if (err.status === 0) {
            errorMessage = 'Cannot connect to server. Please check your connection.';
          }
          
          this.showToast(errorMessage);
        }
      });
    } catch (error) {
      await loading.dismiss();
      this.isSubmitting = false;
      this.showToast('Unexpected error occurred. Please try again.');
    }
  }

  async onSubmit() {
    // Call the login method for form submission
    await this.login();
  }

  goToRegister() {
    this.router.navigate(['/pages/register']);
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'danger') {
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