import { TestBed } from '@angular/core/testing';
import { Position } from '@common/position';
import { DrawService } from './draw.service';
import { MouseDetectionService } from './mouse-detection.service';
import { SocketClientService } from './socket-client.service';

describe('MouseDetectionService', () => {
    let service: MouseDetectionService;
    let socketSpy: jasmine.SpyObj<SocketClientService>;
    let drawServiceSpy: jasmine.SpyObj<DrawService>;
    let mouseEvent: MouseEvent;
    let position: Position = { x: 10, y: 20 };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: SocketClientService, useValue: socketSpy },
                { provide: DrawService, useValue: drawServiceSpy },
            ],
        });
        drawServiceSpy = jasmine.createSpyObj('DrawService', ['drawWord']);
        socketSpy = jasmine.createSpyObj('SocketClientService', ['connect', 'send']);

        drawServiceSpy.context1 = {} as CanvasRenderingContext2D;
        drawServiceSpy.context2 = {} as CanvasRenderingContext2D;
        drawServiceSpy.context3 = {} as CanvasRenderingContext2D;
        drawServiceSpy.context4 = {} as CanvasRenderingContext2D;

        socketSpy.connect();
        drawServiceSpy.drawWord('hello', position, drawServiceSpy.context1);
        service = TestBed.inject(MouseDetectionService);
        service.mousePosition = position;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call mouseHitDetect', () => {
        mouseEvent = {
            offsetX: position.x,
            offsetY: position.y,
            button: 0,
        } as MouseEvent;
        service.mouseHitDetect(mouseEvent);
        expect(service.mousePosition).toEqual(position);
    });

    it('should call playsound', () => {
        service.playSound(true);
        expect(service.audio.src).toEqual('http://localhost:9876/assets/sounds/validSound.mp3');
        expect(service.audio.src).not.toEqual('http://localhost:9876/assets/sounds/invalidSound.mp3');
    });

    it('should call clickMessage with good position', () => {
        service.clickMessage(true);
        expect(service.message).toEqual('GOOD JOB');
    });

    it('should call clickMessage with wrong position', () => {
        service.clickMessage(false);
        expect(service.message).toEqual('ERROR');
    });

    it('should increment nbDifference ', () => {
        service.nbrDifferencesFound = 3;
        service.incrementNbrDifference(true);
        expect(service.nbrDifferencesFound).toEqual(4);
    });
});
