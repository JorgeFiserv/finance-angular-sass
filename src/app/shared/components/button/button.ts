import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  label = input<string>('');
  variant = input<string>('primary');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);

  onClick = output<void>();
}
