import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client.service';
import { StartUpGameService } from '@app/services/start-up-game.service';
import { Socket } from 'socket.io-client';

import { PopDialogUsernameComponent } from './pop-dialog-username.component';
export class SocketClientServiceMock extends SocketClientService {
    override connect() {}
    override off() {
        this.disconnect();
    }
}

describe('PopDialogUsernameComponent', () => {
    let component: PopDialogUsernameComponent;
    let fixture: ComponentFixture<PopDialogUsernameComponent>;
    let socketClientServiceMock: SocketClientServiceMock;
    let startUpGameServiceSpy: jasmine.SpyObj<StartUpGameService>;
    let socketTestHelper: SocketTestHelper;
    let dialogRef: jasmine.SpyObj<MatDialogRef<PopDialogUsernameComponent, any>>;
    let dialog: jasmine.SpyObj<MatDialog>;

    beforeAll(async () => {
        socketTestHelper = new SocketTestHelper();
        socketClientServiceMock = new SocketClientServiceMock();
        socketClientServiceMock.socket = socketTestHelper as unknown as Socket;

        startUpGameServiceSpy = jasmine.createSpyObj('StartUpGameService', ['startUpWaitingLine']);
        dialog = jasmine.createSpyObj('MatDialog', ['open']);
        dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PopDialogUsernameComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: StartUpGameService, useValue: startUpGameServiceSpy },
                { provide: SocketClientService, useValue: socketClientServiceMock },
                { provide: MatDialog, useValue: dialog },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(PopDialogUsernameComponent);
        component = fixture.componentInstance;
        TestBed.inject(SocketClientService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('the button should not be disabled if the input value is not undefined', () => {
        component.disabledButton = true;
        component.username.nativeElement.value = 'test';
        component.inputChanged();
        expect(component.disabledButton).toBeFalsy();
    });

    it('the button should be disabled if the input value is undefined', () => {
        component.disabledButton = true;
        component.username.nativeElement.value = '';
        component.inputChanged();
        expect(component.disabledButton).toBeTrue();
    });

    it('should set the user to not valid', () => {
        socketTestHelper.peerSideEmit('username not valid');
        component['configureUsernamePopUpSocketFeatures']();
        expect(component.usernameNotValid).toEqual(true);
    });

    it('should call dialogRef ', () => {
        socketTestHelper.peerSideEmit('username valid');
        component['configureUsernamePopUpSocketFeatures']();
        expect(dialogRef.close).toHaveBeenCalled();
    });

    it('should start waiting in line', () => {
        component.gameInfo['multiFlag'] = false;
        const spy = spyOn(component, <any>'openDialog');
        socketTestHelper.peerSideEmit('username valid');
        component['configureUsernamePopUpSocketFeatures']();
        expect(startUpGameServiceSpy.startUpWaitingLine).toHaveBeenCalled();
        expect(spy).not.toHaveBeenCalled();
    });

    it('should open dialog if game info multiflag is true', () => {
        component.gameInfo['multiFlag'] = true;
        const spy = spyOn(component, <any>'openDialog');
        socketTestHelper.peerSideEmit('username valid');
        component['configureUsernamePopUpSocketFeatures']();
        expect(spy).toHaveBeenCalled();
    });

    it('should open the dialog when calling openDialog', () => {
        component['openDialog']();
        expect(dialog['open']).toHaveBeenCalled();
    });

    afterEach(() => {
        fixture.destroy();
        TestBed.resetTestingModule();
    });
});
