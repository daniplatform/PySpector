import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallGraph } from './call-graph.component';

describe('CallGraph', () => {
  let component: CallGraph;
  let fixture: ComponentFixture<CallGraph>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallGraph],
    }).compileComponents();

    fixture = TestBed.createComponent(CallGraph);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
