import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GameFormDescription } from '@app/classes/game-form-description';
import {
    ADMIN_GAME_FORMS_BUTTON,
    CLASSIC_FLAG,
    CREATE_FLAG,
    DISABLE_CLOSE,
    JOIN_FLAG,
    MULTIPLAYER_MODE,
    SELECTION_GAME_FORMS_BUTTON,
    SOMEBODY_IS_WAITING,
    STANDARD_POP_UP_HEIGHT,
    STANDARD_POP_UP_WIDTH,
} from '@app/client-consts';
import { PopDialogUsernameComponent } from '@app/components/pop-dialogs/pop-dialog-username/pop-dialog-username.component';
import { SocketClientService } from '@app/services/socket-client.service';

@Component({
    selector: 'app-game-form',
    templateUrl: './game-form.component.html',
    styleUrls: ['./game-form.component.scss'],
})
export class GameFormComponent {
    @Input() gameForm: GameFormDescription;
    @Input() buttonPage: string;
    @Output() newItemEvent = new EventEmitter<string>();
    adminGameFormsButton = ADMIN_GAME_FORMS_BUTTON;
    selectionGameFormsButton = SELECTION_GAME_FORMS_BUTTON;
    multiplayerFlag = MULTIPLAYER_MODE;
    isPlayerWaiting: boolean = !SOMEBODY_IS_WAITING;
    joinFlag: boolean = !JOIN_FLAG;
    createFlag: boolean = !CREATE_FLAG;
    constructor(private dialog: MatDialog, private socketService: SocketClientService) {}

    ngOnInit(): void {
        this.configureGameFormSocketFeatures();
        this.socketService.send('is there someone waiting', this.gameForm.gameName);
    }

    openDialog(multiplayerFlag: boolean): void {
        this.dialog.open(PopDialogUsernameComponent, {
            height: STANDARD_POP_UP_HEIGHT,
            width: STANDARD_POP_UP_WIDTH,
            disableClose: DISABLE_CLOSE,
            data: {
                nameGame: this.gameForm.gameName,
                classicFlag: CLASSIC_FLAG,
                multiFlag: multiplayerFlag,
                joinFlag: this.joinFlag,
                createFlag: this.createFlag,
                isPlayerWaiting: this.isPlayerWaiting,
            },
        });
    }

    deleteGameForm(value: string) {
        this.newItemEvent.emit(value);
    }

    resetTimesBoard(value: string) {
        this.socketService.send('Reset records time board', value);
    }

    setJoinFlag(): void {
        this.joinFlag = JOIN_FLAG;
        this.createFlag = !CREATE_FLAG;
    }

    setCreateFlag(): void {
        this.createFlag = CREATE_FLAG;
        this.joinFlag = !JOIN_FLAG;
    }

    resetFlags(): void {
        this.createFlag = !JOIN_FLAG;
        this.joinFlag = !CREATE_FLAG;
    }

    private configureGameFormSocketFeatures(): void {
        this.socketService.connect();
        if (this.gameForm.gameName) {
            this.socketService.on(`${this.gameForm.gameName} let me tell you if someone is waiting`, (response: boolean) => {
                this.isPlayerWaiting = response;
            });

            this.socketService.on(`${this.gameForm.gameName} nobody is waiting no more`, () => {
                this.isPlayerWaiting = !SOMEBODY_IS_WAITING;
            });

            this.socketService.on('reconnect', () => {
                this.ngOnInit();
            });
        }
    }
}
