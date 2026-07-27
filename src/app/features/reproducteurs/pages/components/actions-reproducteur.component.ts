import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Reproducteur } from '@core/models';

@Component({
  selector: 'app-actions-reproducteur',
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="flex items-center gap-2">
      @if (!isEditing()) {
        <button class="btn border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5" (click)="editTriggered.emit()">
          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">edit</mat-icon>
          Modifier
        </button>
      }
      @if (reproducteur()?.etat !== 'Réformée' && reproducteur()?.etat !== 'Mort') {

        <button class="btn border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5" (click)="withdrawTriggered.emit()">
          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">do_not_disturb_on</mat-icon>
          Retirer de l'élevage
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionsReproducteurComponent {
  reproducteur = input<Reproducteur | undefined>();
  isEditing = input<boolean>(false);

  editTriggered = output<void>();
  withdrawTriggered = output<void>();
}
