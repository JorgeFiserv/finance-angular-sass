import { Directive, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCurrencyInput]',
  standalone: true,
})
export class CurrencyInputDirective implements OnInit {
  private el = inject(ElementRef);
  private ngControl = inject(NgControl, { optional: true });

  ngOnInit() {
    // Formata o valor inicial se existir
    const initialValue = this.ngControl?.value;
    if (initialValue !== null && initialValue !== undefined && initialValue !== '') {
      this.formatValue(initialValue);
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: any) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove tudo exceto números
    value = value.replace(/\D/g, '');

    // Se vazio, limpa
    if (!value) {
      this.updateModel(null);
      input.value = '';
      return;
    }

    // Converte para número com centavos
    const numberValue = parseInt(value, 10) / 100;

    // Atualiza o model com o número
    this.updateModel(numberValue);

    // Formata visualmente
    this.formatValue(numberValue);
  }

  @HostListener('blur')
  onBlur() {
    const value = this.ngControl?.value;
    if (value !== null && value !== undefined && value !== '') {
      this.formatValue(value);
    }
  }

  @HostListener('focus')
  onFocus() {
    const input = this.el.nativeElement;
    // Remove a formatação ao focar para facilitar edição
    const value = this.ngControl?.value;
    if (value !== null && value !== undefined && value !== '') {
      input.value = this.formatNumber(value);
    }
  }

  private formatValue(value: number) {
    const input = this.el.nativeElement;
    input.value = this.formatCurrency(value);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private updateModel(value: number | null) {
    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.setValue(value, { emitEvent: false });
    }
  }
}
