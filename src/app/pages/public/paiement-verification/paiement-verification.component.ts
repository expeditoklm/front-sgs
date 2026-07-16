import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaiementVerification } from '../../../core/models/inscription.models';
import { InscriptionService } from '../../../core/services/inscription.service';

@Component({
  selector: 'app-paiement-verification',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './paiement-verification.component.html'
})
export class PaiementVerificationComponent implements OnInit {
  paiement: PaiementVerification | null = null;
  chargement = true;
  invalide = false;
  code = '';

  constructor(
    private route: ActivatedRoute,
    private inscriptions: InscriptionService
  ) {
  }

  ngOnInit(): void {
    this.code = (this.route.snapshot.paramMap.get('code') ?? '').trim().toUpperCase();
    if (!/^[A-Z2-9]{6,40}$/.test(this.code)) {
      this.chargement = false;
      this.invalide = true;
      return;
    }

    this.inscriptions.verifierPaiement(this.code).subscribe({
      next: (paiement) => {
        this.paiement = paiement;
        this.chargement = false;
      },
      error: () => {
        this.invalide = true;
        this.chargement = false;
      }
    });
  }

  get confirme(): boolean {
    return this.paiement?.statut === 'CONFIRME';
  }
}
