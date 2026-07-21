import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SaisieSaillieComponent } from './saisie-saillie.component';
import { StorageService, CalculationService, NotificationService, BandeService, DataStoreService } from '@core/services';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('SaisieSaillieComponent', () => {
  let component: SaisieSaillieComponent;
  let fixture: ComponentFixture<SaisieSaillieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaisieSaillieComponent, ReactiveFormsModule],
      providers: [
        provideAnimationsAsync(),
        StorageService,
        DataStoreService,
        CalculationService,
        BandeService,
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SaisieSaillieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and initialize forms', () => {
    expect(component).toBeTruthy();
    expect(component.saillieForm).toBeDefined();
    expect(component.saillieIndivForm).toBeDefined();
  });

  it('should initialize modeSaisie to bande by default', () => {
    expect(component.modeSaisie()).toBe('bande');
  });

  it('should reset form when onReset is called', () => {
    component.formBande.get('notes')?.setValue('Test note');
    component.onReset();
    expect(component.formBande.get('notes')?.value).toBe('');
  });
});
