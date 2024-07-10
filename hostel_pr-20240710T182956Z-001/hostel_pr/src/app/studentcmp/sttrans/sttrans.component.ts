import { Component,Input } from '@angular/core';

@Component({
  selector: 'app-sttrans',
  templateUrl: './sttrans.component.html',
  styleUrls: ['./sttrans.component.css']
})
export class SttransComponent {
  @Input() obj
}
