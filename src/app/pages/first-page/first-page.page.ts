import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-first-page',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './first-page.page.html',
  styleUrls: ['./first-page.page.scss'],
})
export class FirstPagePage implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {}
    
    goToLogin() {
      this.router.navigate(['/pages/login']);
    }

    goToRegister() {
      this.router.navigate(['/pages/register']);
    } 
}
