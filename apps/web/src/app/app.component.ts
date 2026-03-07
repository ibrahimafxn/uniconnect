import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {filter} from 'rxjs';
import {AppHeaderComponent} from './shared/app-header/app-header.component';
import {ConfirmModalComponent} from './shared/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, AppHeaderComponent, ConfirmModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'uniconnect-web';
  showHeader = true;

  constructor(private readonly router: Router) {
    this.showHeader = !this.router.url.startsWith('/login');
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.showHeader = !event.urlAfterRedirects.startsWith('/login');
      });
  }
}
