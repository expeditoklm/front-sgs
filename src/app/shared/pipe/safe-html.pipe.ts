import { Pipe, PipeTransform } from '@angular/core';
import { SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'safeHtml' })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(value: string): string | SafeHtml {
    // Angular retire les SVG injectés via innerHTML. Les icônes de l'application sont des
    // constantes locales : on ne les autorise qu'après avoir rejeté les constructions SVG/HTML
    // capables d'exécuter du code ou de charger une ressource externe.
    const trimmed = value.trim();
    const isSvg = /^<svg\b[\s\S]*<\/svg>$/i.test(trimmed);
    const containsUnsafeSvgContent = /<\s*(script|foreignObject|iframe|object|embed|style|link|meta)\b|\bon\w+\s*=|\b(href|src)\s*=|javascript\s*:|data\s*:|url\s*\(/i.test(trimmed);

    if (isSvg && !containsUnsafeSvgContent) {
      return this.sanitizer.bypassSecurityTrustHtml(trimmed);
    }

    // Toute autre valeur continue de passer par la sanitisation HTML standard d'Angular.
    return this.sanitizer.sanitize(SecurityContext.HTML, value) ?? '';
  }
}
