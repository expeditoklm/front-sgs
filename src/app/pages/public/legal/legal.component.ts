import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type LegalPage = 'terms' | 'privacy';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <header>
        <a routerLink="/" class="brand"><img src="/images/favicon.ico" alt=""><strong>SGS</strong><span>Gestion scolaire</span></a>
        <a href="/#demande" class="back">← Retour à la demande</a>
      </header>

      <main>
        <p class="overline">INFORMATIONS JURIDIQUES</p>
        @if (page === 'terms') {
          <h1>Conditions générales d’utilisation et d’abonnement</h1>
          <p class="lead">Ces conditions encadrent l’accès à SGS, la création d’un espace école et l’utilisation des services proposés.</p>
          <section><h2>1. Objet du service</h2><p>SGS fournit aux établissements scolaires un espace numérique de gestion destiné notamment aux inscriptions, au personnel, au suivi pédagogique, aux paiements, aux documents et aux communications.</p></section>
          <section><h2>2. Création et activation d’une école</h2><p>La demande d’ouverture est examinée avant activation. Le demandeur garantit l’exactitude des informations transmises et confirme qu’il est autorisé à agir pour l’établissement concerné.</p></section>
          <section><h2>3. Accès et sécurité</h2><p>Les identifiants sont personnels. L’établissement est responsable de la gestion de ses utilisateurs, de leurs profils et de la confidentialité de leurs accès. Toute utilisation suspecte doit être signalée sans délai.</p></section>
          <section><h2>4. Abonnement et paiement</h2><p>Les fonctionnalités, limites, prix et périodicités applicables sont ceux du plan sélectionné lors de la demande. Tout changement de plan ou de tarif est présenté à l’établissement avant son application.</p></section>
          <section><h2>5. Responsabilités de l’établissement</h2><p>L’établissement reste responsable des données qu’il saisit, de leur licéité, de leur exactitude et des autorisations nécessaires pour traiter les informations des élèves, familles et membres du personnel.</p></section>
          <section><h2>6. Disponibilité et évolution</h2><p>SGS peut faire évoluer le service afin d’en améliorer la sécurité ou les fonctionnalités. Des interruptions temporaires peuvent être nécessaires pour la maintenance.</p></section>
          <section><h2>7. Suspension et résiliation</h2><p>L’accès peut être suspendu en cas de défaut de paiement, d’usage frauduleux, d’atteinte à la sécurité ou de non-respect des présentes conditions, après information de l’établissement lorsque la situation le permet.</p></section>
        } @else {
          <h1>Politique de confidentialité</h1>
          <p class="lead">Cette politique explique quelles données sont utilisées lors d’une demande d’ouverture d’école et dans quel but.</p>
          <section><h2>1. Données collectées</h2><p>SGS collecte les informations fournies dans le formulaire, notamment le nom du fondateur, le nom de l’école, l’adresse électronique, le téléphone, le code souhaité et le plan choisi.</p></section>
          <section><h2>2. Finalités</h2><p>Ces données servent à examiner la demande, contacter le demandeur, créer l’espace de l’établissement, sécuriser les accès et assurer la gestion de l’abonnement.</p></section>
          <section><h2>3. Accès aux données</h2><p>Les informations sont accessibles uniquement aux personnes et prestataires autorisés qui en ont besoin pour traiter la demande, fournir le service, assurer son hébergement ou sa sécurité.</p></section>
          <section><h2>4. Conservation</h2><p>Les données sont conservées pendant la durée nécessaire au traitement de la demande et à la relation contractuelle, puis archivées ou supprimées conformément aux obligations applicables.</p></section>
          <section><h2>5. Sécurité</h2><p>Des mesures techniques et organisationnelles sont mises en œuvre pour limiter l’accès non autorisé, la perte, l’altération ou la divulgation des données.</p></section>
          <section><h2>6. Vos droits</h2><p>Vous pouvez demander l’accès, la rectification ou la suppression de vos informations, ainsi que la limitation de certains traitements, sous réserve des obligations légales et contractuelles applicables.</p></section>
          <section><h2>7. Contact</h2><p>Pour toute question relative à vos données, utilisez les coordonnées de contact communiquées par l’équipe SGS.</p></section>
        }
        <p class="updated">Dernière mise à jour : 20 août 2026</p>
      </main>
    </div>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:#f7f6f1;color:#15213b;font-family:Outfit,Arial,sans-serif}.page{min-height:100vh}header{height:82px;border-bottom:1px solid #dcded9;display:flex;align-items:center;justify-content:space-between;padding:0 max(24px,calc((100vw - 1040px)/2))}.brand{display:flex;align-items:center;gap:9px}.brand img{width:31px;height:31px}.brand strong{font-size:22px}.brand span{font-size:10px;color:#7b8492}.back{font-size:13px;font-weight:700;color:#3155d9}main{max-width:860px;margin:auto;padding:80px 24px 110px}.overline{font-size:11px;letter-spacing:.15em;font-weight:700;color:#3155d9}h1{max-width:780px;margin:22px 0;font-size:clamp(38px,5vw,64px);line-height:1.04;letter-spacing:-.045em}.lead{max-width:700px;margin-bottom:58px;font-size:18px;line-height:1.65;color:#667083}section{padding:28px 0;border-top:1px solid #d8dad6}h2{margin-bottom:12px;font-size:20px}section p{font-size:15px;line-height:1.75;color:#5f6879}.updated{margin-top:35px;font-size:12px;color:#858d99}@media(max-width:620px){header{height:70px}.brand span{display:none}main{padding-top:55px}.back{font-size:12px}h1{font-size:40px}}
  `]
})
export class LegalComponent implements OnInit {
  page: LegalPage = 'terms';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.page = this.route.snapshot.data['legalPage'] === 'privacy' ? 'privacy' : 'terms';
  }
}
