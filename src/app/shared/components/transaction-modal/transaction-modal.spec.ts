import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionModal } from './transaction-modal';

describe('TransactionModal', () => {
  let component: TransactionModal;
  let fixture: ComponentFixture<TransactionModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
