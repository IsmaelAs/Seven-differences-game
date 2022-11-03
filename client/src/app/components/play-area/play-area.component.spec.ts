import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { DifferenceDetectionService } from '@app/services/difference-detection.service';
import { DrawService } from '@app/services/draw.service';
import { ImageGeneratorService } from '@app/services/image-generator.service';
import { ImageToImageDifferenceService } from '@app/services/image-to-image-difference.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Position } from '@common/position';
import { Socket } from 'socket.io-client';
import { PlayAreaComponent } from './play-area.component';
import SpyObj = jasmine.SpyObj;
describe('PlayAreaComponent', () => {
    let component: PlayAreaComponent;
    let fixture: ComponentFixture<PlayAreaComponent>;
    let socketServiceSpy: SpyObj<SocketClientService>;
    let differenceServiceSpy: SpyObj<DifferenceDetectionService>;
    let drawServiceSpy: SpyObj<DrawService>;
    let matDialogSpy: SpyObj<MatDialog>;
    let imageGeneratorSpy: SpyObj<ImageGeneratorService>;
    let imageDifferenceSpy: SpyObj<ImageToImageDifferenceService>;
    let mouseEvent: MouseEvent;
    let position: Position = { x: 10, y: 20 };
    let differenceImage: HTMLImageElement[] = [new Image(640, 480)];
    let socketTestHelper: SocketTestHelper;

    beforeAll(async () => {
        socketServiceSpy = jasmine.createSpyObj('SocketClientService', ['connect', 'on', 'send']);
        differenceServiceSpy = jasmine.createSpyObj('MouseDetectionService', ['mouseHitDetect', 'clickMessage']);
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        drawServiceSpy = jasmine.createSpyObj('DrawService', ['context1', 'context2', 'context3', 'drawWord']);
        imageGeneratorSpy = jasmine.createSpyObj('ImageGeneratorService', ['copyCertainPixelsFromOneImageToACanvas']);
        imageDifferenceSpy = jasmine.createSpyObj('ImageToImageDifferenceService', ['waitForImageToLoad']);
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlayAreaComponent],
            providers: [
                { provide: SocketClientService, useValue: socketServiceSpy },
                { provide: DrawService, useValue: drawServiceSpy },
                { provide: DifferenceDetectionService, useValue: differenceServiceSpy },
                { provide: ImageToImageDifferenceService, useValue: imageDifferenceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: ImageGeneratorService, useValue: imageGeneratorSpy },
            ],
        }).compileComponents();
    });

    beforeEach(async () => {
        fixture = TestBed.createComponent(PlayAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.differentImages = differenceImage;
        const socketService = TestBed.inject(SocketClientService);
        socketTestHelper = new SocketTestHelper();

        socketService.socket = socketTestHelper as unknown as Socket;

        //Dans le tests
        //socketTestHelper.peerSideEmit('Valid click');
    });

    it('should display images ', () => {
        component.displayImages();
        fixture.detectChanges();
        expect(drawServiceSpy).toHaveBeenCalled();
    });

    it('should open dialog', () => {
        component.openEndGameDialog('Hello');
        expect(matDialogSpy).toBeTruthy();
    });

    it('should detect mouseEvent', () => {
        mouseEvent = {
            offsetX: position.x,
            offsetY: position.y,
            button: 0,
        } as MouseEvent;
        component.detectDifference(mouseEvent);
        expect(differenceServiceSpy['mouseHitDetect']).toHaveBeenCalled();
    });

    it('sould verify if game is finished', () => {});
});
