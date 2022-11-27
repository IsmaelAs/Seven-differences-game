import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogInputComponent } from '@app/components/dialog-input/dialog-input.component';
import { PopDialogResetComponent } from '@app/components/pop-dialogs/pop-dialog-reset/pop-dialog-reset.component';
import { GameTimeSetting } from '@app/interfaces/game-time-setting';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
})
export class AdminPageComponent {
    private gameTimeSettings: GameTimeSetting[] = [
        { inputName: 'Temps initial', defaultTime: 30, placeHolder: 'Temps par défaut: 30s', valueUnit: 'secondes' },
        { inputName: 'Temps de pénalité', defaultTime: 5, placeHolder: 'Temps par défaut: 5s', valueUnit: 'secondes' },
        { inputName: 'Temps gagné', defaultTime: 5, placeHolder: 'Temps par défaut: 5s', valueUnit: 'secondes' },
    ];
    constructor(public dialog: MatDialog) {}
    nameOfPage: string = 'Admin';

    openDialog() {
        this.dialog.open(DialogInputComponent, {
            height: '540px',
            width: '580px',
            disableClose: true,
            data: this.gameTimeSettings,
        });
    }

    openResetDialog() {
        this.dialog.open(PopDialogResetComponent, {
            height: '320px',
            width: '580px',
            disableClose: true,
        });
    }
}
