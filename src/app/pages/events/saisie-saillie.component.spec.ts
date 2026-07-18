import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SaisieSaillieComponent } from './saisie-saillie.component';
import { StorageService } from '../../core/services/storage.service';
import { CalculationService } from '../../core/services/calculation.service';
import { NotificationService } from '../../core/services/notification.service';
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
        CalculationService,
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SaisieSaillieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize the form and keep female field disabled by default', () => {
    expect(component).toBeTruthy();
    expect(component.saillieForm).toBeDefined();
    expect(component.saillieForm.get('femelle')?.disabled).toBe(true);
  });

  it('should enable female control when bande is selected', () => {
    component.saillieForm.get('bande')?.setValue('b1');
    expect(component.saillieForm.get('femelle')?.disabled).toBe(false);
  });

  it('should disable female control and clear value when reset is clicked', () => {
    component.saillieForm.get('bande')?.setValue('b1');
    component.saillieForm.get('femelle')?.setValue('F001');
    expect(component.saillieForm.get('femelle')?.disabled).toBe(false);

    component.onReset();
    expect(component.saillieForm.get('bande')?.value).toBe('');
    expect(component.saillieForm.get('femelle')?.value).toBe('');
    expect(component.saillieForm.get('femelle')?.disabled).toBe(true);
  });
});
