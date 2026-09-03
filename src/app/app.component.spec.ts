import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { LinkService } from './link.service';
import { of } from 'rxjs';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: LinkService,
          useValue: {
            list: () => of([]),
            create: () => of({
              code: 'abc123',
              url: 'https://example.com',
              shortUrl: 'http://localhost:3000/abc123',
              hits: 0,
              createdAt: '2026-09-03T00:00:00.000Z'
            })
          }
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the Snip UI', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Shorten links');
  });

  it('should display short links on the current website origin', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.shortLink({
      code: 'abc123',
      url: 'https://example.com',
      shortUrl: 'http://localhost:3000/abc123',
      hits: 0,
      createdAt: '2026-09-03T00:00:00.000Z'
    })).toBe(`${globalThis.location.origin}/abc123`);
  });
});
