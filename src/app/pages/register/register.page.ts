import { Component, OnInit } from '@angular/core';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agree: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      await this.register();
    } else {
      this.markFormGroupTouched();
      this.showToast('Please fill in all required fields correctly.');
    }
  }

  async register() {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: 'Creating account...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      const formValue = this.registerForm.value;
      const apiUrl = 'http://127.0.0.1:8000/api/register/';
       //const apiUrl = `${(environment as any).apiUrl}/predict/`;
      const registerData = {
        first_name: formValue.firstName,
        last_name: formValue.lastName,
        address: formValue.address,
        email: formValue.email,
        password: formValue.password
      };

      this.http.post(apiUrl, registerData, { headers }).subscribe({
        next: async (response: any) => {
          await loading.dismiss();
          this.isSubmitting = false;
          
          if (response.success) {
            this.showToast('Account created successfully!', 'success');
            this.router.navigate(['/pages/login']);
          } else {
            this.showToast(response.message || 'Registration failed');
          }
        },
        error: async (err) => {
          await loading.dismiss();
          this.isSubmitting = false;
          console.error('Registration error:', err);
          
          let errorMessage = 'Registration failed. Please try again.';
          if (err.status === 400) {
            errorMessage = err.error?.message || 'Email already exists or invalid data.';
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

  goToLogin() {
    this.router.navigate(['/pages/login']);
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
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
