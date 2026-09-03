import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { LinkService, SnipLink } from './link.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private readonly linksApi = inject(LinkService);

  readonly links = signal<SnipLink[]>([]);
  readonly latestLink = signal<SnipLink | null>(null);
  readonly error = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);

  url = '';

  ngOnInit() {
    this.loadLinks();
  }

  createLink() {
    this.error.set('');
    this.latestLink.set(null);

    const trimmedUrl = this.url.trim();
    if (!this.isHttpUrl(trimmedUrl)) {
      this.error.set('Enter a valid URL that starts with http:// or https://.');
      return;
    }

    this.saving.set(true);
    this.linksApi.create(trimmedUrl)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (link) => {
          this.latestLink.set(link);
          this.links.update((links) => [link, ...links.filter((item) => item.code !== link.code)]);
          this.url = '';
        },
        error: (error: unknown) => this.error.set(this.errorMessage(error))
      });
  }

  loadLinks() {
    this.loading.set(true);
    this.linksApi.list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (links) => this.links.set(links),
        error: (error: unknown) => this.error.set(this.errorMessage(error))
      });
  }

  private isHttpUrl(value: string) {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private errorMessage(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.error === 'string') {
        return error.error.error;
      }

      return error.status === 0
        ? 'Could not reach the Snip API at http://localhost:3000.'
        : `Snip API returned ${error.status}: ${error.statusText}`;
    }

    return 'Something went wrong. Please try again.';
  }
}
