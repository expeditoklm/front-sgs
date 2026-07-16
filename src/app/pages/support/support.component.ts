import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthenticationService } from '../../core/services/authentication.service';
import { ToastService } from '../../core/services/toast.service';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-support',
  imports: [RouterModule, PageBreadcrumbComponent],
  templateUrl: './support.component.html',
  styles: ``
})
export class SupportComponent {
  openFaq: number | null = 0;
  readonly online = navigator.onLine;

  readonly faqs: FaqItem[] = [
    {
      question: 'Je ne vois pas les données attendues. Que dois-je vérifier ?',
      answer: 'Vérifiez d’abord le profil sélectionné à la connexion, l’année scolaire active et les filtres de la page. Actualisez ensuite les données. Si le problème persiste, copiez le diagnostic ci-dessous.'
    },
    {
      question: 'Pourquoi une action m’est-elle refusée ?',
      answer: 'Les fonctionnalités SGS dépendent du rôle connecté. Une réponse 403 signifie généralement que le profil actif ne possède pas le droit requis. Reconnectez-vous avec le bon profil ou contactez un administrateur.'
    },
    {
      question: 'Comment modifier mes informations personnelles ?',
      answer: 'Ouvrez Mon profil depuis le menu utilisateur. Vous pouvez modifier votre nom, prénom, adresse e-mail et téléphone. Le login, le rôle et l’état du compte restent administrés.'
    },
    {
      question: 'Comment changer ou récupérer mon mot de passe ?',
      answer: 'Depuis Paramètres du compte, demandez un lien de réinitialisation. Le lien est envoyé par e-mail et reste valable 15 minutes. En environnement local, consultez la boîte MailDev.'
    },
    {
      question: 'À quoi sert la cloche de notifications ?',
      answer: 'Elle regroupe uniquement les actions métier en attente correspondant à votre rôle, par exemple les inscriptions, paiements ou congés à traiter. Les messages temporaires de succès ou d’erreur restent affichés sous forme de notifications brèves.'
    }
  ];

  constructor(
    public authenticationService: AuthenticationService,
    private toastService: ToastService
  ) {
  }

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }

  async copierDiagnostic(): Promise<void> {
    const user = this.authenticationService.user();
    const diagnostic = [
      'Diagnostic SGS',
      `Date : ${new Date().toLocaleString('fr-FR')}`,
      `Page : ${window.location.href}`,
      `Utilisateur : ${user?.login || 'inconnu'}`,
      `Profil : ${user?.profilCode || 'inconnu'}`,
      `Navigateur : ${navigator.userAgent}`,
      `Connexion : ${navigator.onLine ? 'en ligne' : 'hors ligne'}`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(diagnostic);
      this.toastService.success('Le diagnostic a été copié. Joignez-le à votre demande d’assistance.');
    } catch {
      this.toastService.error('Le navigateur n’a pas autorisé la copie du diagnostic.');
    }
  }
}
