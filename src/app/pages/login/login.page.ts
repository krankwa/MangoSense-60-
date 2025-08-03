import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  email: string = '';
  password: string = '';
  isSubmitting: boolean = false;

  constructor(
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private formBuilder: FormBuilder,
    private http: HttpClient
  ) { 
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      const formValue = this.loginForm.value;
      this.email = formValue.email;
      this.password = formValue.password;
      await this.login();
      this.isSubmitting = false;
    } else {
      const toast = await this.toastController.create({
        message: 'Please fill in all fields correctly',
        duration: 2000,
        color: 'danger'
      });
      toast.present();
    }
  }

  async login() {
    if (!this.email || !this.password) {
      const toast = await this.toastController.create({
        message: 'Please fill in all fields',
        duration: 2000,
        color: 'danger'
      });
      toast.present();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Logging in...'
    });
    await loading.present();

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const apiUrl = 'http://127.0.0.1:8000/api/login/';

    this.http.post(apiUrl, this.loginForm.value, { headers }).subscribe({
      next: async (response: any) => {
        await loading.dismiss();
        this.isSubmitting = false;
        
        if (response.success || response.access) {
          // Store JWT tokens
          if (response.access) {
            localStorage.setItem('accessToken', response.access);
          }
          if (response.refresh) {
            localStorage.setItem('refreshToken', response.refresh);
          }
          if (response.user) {
            localStorage.setItem('userInfo', JSON.stringify(response.user));
            localStorage.setItem('userName', response.user.firstName + ' ' + response.user.lastName);
          }
          
          localStorage.setItem('isAuthenticated', 'true');
          
          const toast = await this.toastController.create({
            message: 'Login successful!',
            duration: 2000,
            color: 'success'
          });
          toast.present();
          
          this.router.navigate(['/pages/home']);
        } else {
          const toast = await this.toastController.create({
            message: response.message || 'Login failed',
            duration: 3000,
            color: 'danger'
          });
          toast.present();
        }
      },
      error: async (error) => {
        await loading.dismiss();
        this.isSubmitting = false;
        
        const toast = await this.toastController.create({
          message: 'Login failed. Please check your credentials.',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/pages/register']);
  }
}
