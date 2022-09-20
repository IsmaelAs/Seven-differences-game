import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PopDialogDownloadImagesComponent } from '@app/components/pop-dialogs/pop-dialog-download-images/pop-dialog-download-images.component';
import { PopDialogValidateGameComponent } from '@app/components/pop-dialogs/pop-dialog-validate-game/pop-dialog-validate-game.component';
@Component({
    selector: 'app-game-creation-page',
    templateUrl: './game-creation-page.component.html',
    styleUrls: ['./game-creation-page.component.scss'],
})
export class GameCreationPageComponent {
    constructor(private dialog: MatDialog) {}

    onCreateDownloadPopDialog() {
        this.dialog.open(PopDialogDownloadImagesComponent, {
            height: '400px',
            width: '600px',
        });
    }

    onCreateValidatePopDialog() {
        this.dialog.open(PopDialogValidateGameComponent, {
            height: '400px',
            width: '600px',
        });
    }
}
