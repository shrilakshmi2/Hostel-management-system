import { Component,Input } from '@angular/core';

@Component({
  selector: 'app-stabout',
  templateUrl: './stabout.component.html',
  styleUrls: ['./stabout.component.css']
})
export class StaboutComponent {
  @Input() obj
}
