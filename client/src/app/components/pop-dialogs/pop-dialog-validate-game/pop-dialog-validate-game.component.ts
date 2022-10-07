import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PopDialogCreateGameComponent } from '../pop-dialog-create-game/pop-dialog-create-game.component';
@Component({
    selector: 'app-pop-dialog-validate-game',
    templateUrl: './pop-dialog-validate-game.component.html',
    styleUrls: ['./pop-dialog-validate-game.component.scss'],
})
export class PopDialogValidateGameComponent  {
    areImageDifferenceAndNumberDifferenceReady:boolean = false;
    isChecked = false
    isDisabled:boolean ;
    valueChosen:number = 3;
    numberDifference:number;
    imageDifference:any;
    constructor(private dialog: MatDialog) {}
    
    onCreateCreateGame() {
        this.dialog.open(PopDialogCreateGameComponent, {
            height: '400px',
            width: '600px',
        });
    }

    startsGeneratingImageDifferenceAndNumberDifference(){
        if(this.valueChosen ){
            this.areImageDifferenceAndNumberDifferenceReady = true;
        } else {
        this.areImageDifferenceAndNumberDifferenceReady = false;
        }
    }


    onRadiusChanged(value: number){
        
        console.log(value)
        this.valueChosen = value
    }


}