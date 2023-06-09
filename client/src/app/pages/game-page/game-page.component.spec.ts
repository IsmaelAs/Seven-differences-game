import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { TopbarComponent } from '@app/components/topbar/topbar.component';
import { CommunicationService } from '@app/services/communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { ADVERSARY_PLR_USERNAME_POS } from '@common/const';
import { Game } from '@common/game';
import { GameplayDifferenceInformations } from '@common/gameplay-difference-informations';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { GamePageComponent } from './game-page.component';
import SpyObj = jasmine.SpyObj;

class SocketClientServiceMock extends SocketClientService {
    override connect() {}
}

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    let timeServiceSpy: SpyObj<TimeService>;
    let communicationServiceSpy: SpyObj<CommunicationService>;
    let testGame: Game;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        testGame = {
            name: 'test game',
            numberOfDifferences: 7,
            times: [],
            images: [],
            differencesList: [],
        };

        timeServiceSpy = jasmine.createSpyObj('TimeService', ['classicMode', 'changeTime']);
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['getGames']);
        communicationServiceSpy.getGames.and.returnValue(of([testGame]));
        await TestBed.configureTestingModule({
            declarations: [GamePageComponent, SidebarComponent, TopbarComponent],
            providers: [
                { provide: SocketClientService, useValue: socketServiceMock },
                { provide: TimeService, useValue: timeServiceSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: MatDialog, useValue: {} },
                { provide: MatDialogRef, useValue: {} },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Receiving events', () => {
        it('should handle classic mode event and call the classicMode method of the time service', () => {
            socketHelper.peerSideEmit('classic mode');
            expect(component['timeService'].classicMode).toHaveBeenCalled();
        });

        it('should handle time event and call the changeTime method of the time service', () => {
            const testTime = {
                seconds: 0,
                minutes: 0,
            };
            socketHelper.peerSideEmit('time', testTime);
            expect(component['timeService'].changeTime).toHaveBeenCalledWith(testTime);
        });

        it("should handle 'show the username' event and set the username value to the received username", () => {
            const username = 'username';
            socketHelper.peerSideEmit('show the username', username);
            expect(component.usernames[0]).toEqual(username);
        });

        it("should handle 'Valid click' event and increment the number of player", () => {
            const differencesInfo: GameplayDifferenceInformations = {
                differencePixelsNumbers: [],
                isValidDifference: true,
                socketId: '',
                playerUsername: '',
            };
            const spy = spyOn(component, <any>'incrementPlayerNbOfDifferencesFound').and.callFake(() => {});
            socketHelper.peerSideEmit('Valid click', differencesInfo);
            expect(spy).toHaveBeenCalled();
        });

        it("should call 'incrementPlayerNbOfDifferencesFound' and increment the right counter for the right player", () => {
            const differencesInfo: GameplayDifferenceInformations = {
                differencePixelsNumbers: [],
                isValidDifference: true,
                socketId: socketServiceMock.socket.id,
                playerUsername: '',
            };
            const spy = spyOn(component, <any>'incrementPlayerNbOfDifferencesFound').and.callFake(() => {});
            socketHelper.peerSideEmit('Valid click', differencesInfo);
            expect(spy).toHaveBeenCalled();
        });

        it("should handle 'The game is' event and set the value of its attribute nbDifferences to the value of the number of differences of the game wanted", () => {
            const nameOfGame = 'test game';
            socketHelper.peerSideEmit('The game is', nameOfGame);
            expect(component['communicationService'].getGames).toHaveBeenCalled();
            expect(7).toEqual(testGame.numberOfDifferences);
        });

        // Ce test est inutile comme expliqué aux lignes 54 et 55 du fichier game-page.component.ts, cependant il a été fait car sinon nous n'atteignons pas
        // une couverture de 100%
        it("should handle 'The game is' event and set the value of its attribute nbDifferences to undefined when the game wanted doesn't exists", () => {
            const nameOfGame = 'unvalid game';
            socketHelper.peerSideEmit('The game is', nameOfGame);
            expect(component['communicationService'].getGames).toHaveBeenCalled();
            expect(component.nbDifferences).toBeUndefined();
        });
    });

    it("should handle 'The adversary username is' event and set the value of the adversary username", () => {
        const testUsername = 'userAdversary';
        socketHelper.peerSideEmit('The adversary username is', testUsername);
        expect(component.usernames[ADVERSARY_PLR_USERNAME_POS]).toEqual(testUsername);
    });

    describe('Emiting events', () => {
        it('should send a kill the game event on destroy', () => {
            const spy = spyOn(component['socketService'], 'send');
            const eventName = 'kill the game';
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalledWith(eventName);
        });
    });
});
