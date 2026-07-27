import { Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, ToastService, DataStoreService } from '@core/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private dataStore = inject(DataStoreService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly hidePassword = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.value;
    const success = await this.authService.login(email, password);

    if (success) {
      this.errorMessage.set(null);
      this.dataStore.loadAllData();
      this.toastService.success('Connexion réussie ! Bienvenue sur la plateforme.');
      this.router.navigate(['/dashboard/accueil']);
    } else {
      this.errorMessage.set('Adresse e-mail ou mot de passe incorrect. Veuillez réessayer.');
      this.toastService.error('Échec de la connexion.');
    }
  }
}
