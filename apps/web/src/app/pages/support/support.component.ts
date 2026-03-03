import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {SUPPORT_EMAIL, SUPPORT_STATUS, SUPPORT_STATUS_DETAIL} from '../../core/app-settings';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss',
})
export class SupportComponent {
  supportEmail = SUPPORT_EMAIL;
  supportStatus = SUPPORT_STATUS;
  supportStatusDetail = SUPPORT_STATUS_DETAIL;

  faqs = [
    {
      question: 'Je ne peux pas me connecter. Que faire ?',
      answer: 'Vérifie ton email et ton mot de passe, puis contacte la scolarité si le compte est bloqué.',
    },
    {
      question: 'Comment signaler une erreur sur un paiement ?',
      answer: 'Rassemble le numéro de reçu et contacte le support avec la preuve de paiement.',
    },
    {
      question: 'Je ne vois pas mon planning.',
      answer: 'Assure-toi d’être inscrit au bon groupe et à la bonne année académique.',
    },
  ];

  get supportMailto(): string {
    const subject = encodeURIComponent('Demande Support ENT');
    return `mailto:${this.supportEmail}?subject=${subject}`;
  }
}
