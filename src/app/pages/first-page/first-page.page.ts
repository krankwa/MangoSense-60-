import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-first-page',
  templateUrl: './first-page.page.html',
  styleUrls: ['./first-page.page.scss'],
  standalone: false
})
export class FirstPagePage implements OnInit {

  constructor(
    private router: Router,
    private navCtrl: NavController
  ) {}

  ngOnInit() {}
    
  async goToLogin() {
    try {
      console.log('Navigating to login...');
      await this.navCtrl.navigateForward('/pages/login');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to router navigation
      this.router.navigate(['/pages/login']).catch(err => {
        console.error('Router navigation failed:', err);
      });
    }
  }

  async goToRegister() {
    try {
      console.log('Navigating to register...');
      await this.navCtrl.navigateForward('/pages/register');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to router navigation
      this.router.navigate(['/pages/register']).catch(err => {
        console.error('Router navigation failed:', err);
      });
    }
  } 
}
