import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ConfigComponent } from './config.component';
import { StorageService } from '../../core/services/storage.service';
import { CalculationService } from '../../core/services/calculation.service';
import { NotificationService } from '../../core/services/notification.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('ConfigComponent', () => {
  let component: ConfigComponent;
  let fixture: ComponentFixture<ConfigComponent>;
  let storageService: StorageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigComponent, ReactiveFormsModule],
      providers: [
        provideAnimationsAsync(),
        StorageService,
        CalculationService,
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigComponent);
    component = fixture.componentInstance;
    storageService = TestBed.inject(StorageService);
    fixture.detectChanges();
  });

  it('should create the component and initialize the form', () => {
    expect(component).toBeTruthy();
    expect(component.configForm).toBeDefined();
    const config = storageService.getConfiguration();
    expect(component.configForm.get('nombreCagesTotal')?.value).toBe(config.nombreCagesTotal);
  });

  it('should reset form to stored values when resetForm is called', () => {
    component.configForm.get('nombreCagesTotal')?.setValue(999);
    expect(component.configForm.get('nombreCagesTotal')?.value).toBe(999);
    component.resetForm();
    const config = storageService.getConfiguration();
    expect(component.configForm.get('nombreCagesTotal')?.value).toBe(config.nombreCagesTotal);
  });

  it('should validate form and invalidate on negative values', () => {
    component.configForm.get('nombreCagesTotal')?.setValue(-5);
    expect(component.configForm.invalid).toBe(true);
  });
});
