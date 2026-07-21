import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, NotificationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-saisie-deces',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule
  ],
  templateUrl: './saisie-deces.component.html',
  styleUrl: './saisie-deces.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaisieDecesComponent {
  private calcService = inject(CalculationService);
  private notifier = inject(NotificationService);
  private fb = inject(FormBuilder);

  reproducteurs = toSignal(this.calcService.reproducteurs$);

  reproducteursVivants = computed(() => {
    const list = this.reproducteurs() || [];
    return list.filter(r => r.etat !== 'Mort' && r.etat !== 'Réformé');
  });

  activeReproducteurs = this.reproducteursVivants;

  decesForm: FormGroup;

  causes = [
    'Maladie respiratoire (coryza, pasteurellose)',
    'Problème digestif (entérite, ballonnement)',
    'Mort subite sans symptôme préalable',
    'Complication mise-bas / allaitement',
    'Stress / coup de chaleur',
    'Autre cause'
  ];

  constructor() {
    this.decesForm = this.fb.group({
      reproducteurId: ['', Validators.required],
      date: [new Date(), [Validators.required, this.dateNotFutureValidator]],
      cause: ['', Validators.required],
      observations: ['']
    });
  }

  dateNotFutureValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const dateVal = new Date(control.value);
    dateVal.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateVal > today) {
      return { futureDate: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.decesForm.valid) {
      const formValue = this.decesForm.value;
      const list = this.reproducteurs() || [];
      const rep = list.find(r => r.id === formValue.reproducteurId);

      this.calcService.addDeces({
        id: `dec_${Date.now()}_${formValue.reproducteurId}`,
        reproducteurId: formValue.reproducteurId,
        dateDeces: formValue.date,
        cause: formValue.cause,
        observations: formValue.observations
      });

      this.notifier.error(`Décès enregistré : ${rep ? rep.nom : formValue.reproducteurId}. Son état est passé à 'Mort'.`);
      this.onReset();
    }
  }

  onReset(): void {
    this.decesForm.reset({
      reproducteurId: '',
      date: new Date(),
      cause: '',
      observations: ''
    });
  }
}