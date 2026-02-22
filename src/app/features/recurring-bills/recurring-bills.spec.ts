import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecurringBills } from './recurring-bills';

describe('RecurringBills', () => {
  let component: RecurringBills;
  let fixture: ComponentFixture<RecurringBills>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurringBills]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecurringBills);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
