import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare const katex: any;

@Pipe({
    name: 'latex',
    standalone: true
})
export class LatexPipe implements PipeTransform {
    private sanitizer = inject(DomSanitizer);

    transform(value: string | null | undefined): SafeHtml {
        if (!value) return '';

        // Escape HTML first to prevent XSS, then process LaTeX
        let processed = this.escapeHtml(value);

        // Check if KaTeX is loaded
        if (typeof katex === 'undefined') {
            // KaTeX not loaded yet, return text as-is (without $ symbols)
            processed = processed.replace(/\$([^$]+)\$/g, (_match: string, latex: string) => {
                return latex
                    .replace(/\\cdot/g, '·')
                    .replace(/\\times/g, '×')
                    .replace(/\\to/g, '→')
                    .replace(/\\Delta/g, 'Δ')
                    .replace(/\\approx/g, '≈')
                    .replace(/\\pi/g, 'π')
                    .replace(/\\leq/g, '≤')
                    .replace(/\\geq/g, '≥')
                    .replace(/\\neq/g, '≠')
                    .replace(/\\,/g, ' ')
                    .replace(/_\{([^}]+)\}/g, '$1')
                    .replace(/_([a-zA-Z0-9])/g, '$1')
                    .replace(/\^{([^}]+)}/g, '$1')
                    .replace(/\^([a-zA-Z0-9])/g, '$1')
                    .replace(/\\\\/g, '');
            });
            return this.sanitizer.bypassSecurityTrustHtml(processed);
        }

        // Replace $...$ with KaTeX rendered HTML
        processed = processed.replace(/\$([^$]+)\$/g, (_match: string, latex: string) => {
            try {
                // Unescape HTML entities back for KaTeX processing
                const unescapedLatex = latex
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"');

                return katex.renderToString(unescapedLatex, {
                    throwOnError: false,
                    displayMode: false,
                    output: 'html'
                });
            } catch (e) {
                // If KaTeX fails, return the original text without $ signs
                return latex;
            }
        });

        return this.sanitizer.bypassSecurityTrustHtml(processed);
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
