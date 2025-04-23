import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickActionsMenuComponent } from './quick-actions-menu.component';

describe('QuickActionsMenuComponent', () => {
  let component: QuickActionsMenuComponent;
  let fixture: ComponentFixture<QuickActionsMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuickActionsMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickActionsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
