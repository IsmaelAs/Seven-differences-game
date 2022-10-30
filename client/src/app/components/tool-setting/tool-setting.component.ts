import { Component, HostListener, Input, OnInit } from '@angular/core';
import { DrawingHistoryService } from '@app/services/drawing-history.service';
import { PencilService } from '@app/services/pencil.service';
import { BIG, BLACK_COLOR, MEDIUM, SMALL, VERY_BIG, VERY_SMALL } from '@common/const';
@Component({
  selector: 'app-tool-setting',
  templateUrl: './tool-setting.component.html',
  styleUrls: ['./tool-setting.component.scss']
})
export class ToolSettingComponent implements OnInit {
  widths:number[] = [VERY_SMALL,SMALL,MEDIUM,BIG,VERY_BIG]
  color:string;
  @Input() indexTool:number;
  constructor(private pencilService:PencilService,
    private drawingHistoryService: DrawingHistoryService,
    ) { }


  ngOnInit(): void {
    this.setOriginalSetting()
  }

  @HostListener('document:keyup.control.z', ['$event'])
  handleKeyboardToCancelDrawnLine(event: KeyboardEvent) { 
    this.cancelActionDrawnLine()
  }

  @HostListener('document:keyup.control.shift.z', ['$event'])
  handleKeyboardToCancelDeletedDrawnLine(event: KeyboardEvent) { 
    this.cancelActionDeletedDrawnLine()
  }

  checkIfThereAreSavedDrawnLines(){
    if (this.drawingHistoryService.cancelDrawingHistory[this.drawingHistoryService.index].length != 0){
      return false
    } else{
      return true;
    }
  }

  checkIfThereAreSavedDeletedDrawnLines(){
    if (this.drawingHistoryService.undoCancelDrawingHistory[this.drawingHistoryService.index].length != 0){
      return false
    } else{
      return true;
    }
  }

  cancelActionDrawnLine(){
      this.drawingHistoryService.cancelCanvas();
      this.drawingHistoryService.cancelCanvas();

  }

  cancelActionDeletedDrawnLine(){
      this.drawingHistoryService.cancelDeletedCanvas();
      this.drawingHistoryService.cancelDeletedCanvas();

  }

  setOriginalSetting(){
    this.pencilService.setWidth(VERY_SMALL,this.indexTool);
    this.pencilService.setColor(BLACK_COLOR,this.indexTool);
  }

  onChangeColor():void{
    this.pencilService.setColor(this.color,this.indexTool);
  }

  onChangeWidth(width: number):void{
    this.pencilService.setWidth(width,this.indexTool);
  }
}
