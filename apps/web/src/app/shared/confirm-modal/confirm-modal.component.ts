import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../core/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent implements OnInit {
  state$!: ConfirmService['state$'];

  constructor(private readonly confirm: ConfirmService) {}

  ngOnInit() {
    this.state$ = this.confirm.state$;
  }

  onConfirm() {
    this.confirm.confirm();
  }

  onCancel() {
    this.confirm.cancel();
  }
}
