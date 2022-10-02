import { GamesService } from '@app/services/local.games.service';
import { MODIFIED_IMAGE_POSITION, ORIGINAL_IMAGE_POSITION } from '@common/const';
import { ImageDataToCompare } from '@common/image-data-to-compare';
import { Position } from '@common/position';
import * as fs from 'fs';
import * as http from 'http';
import * as io from 'socket.io';
import Container from 'typedi';
import { ChronometerService } from './chronometer.service';
import { DifferenceDetectorService } from './difference-detector.service';
import { MouseHandlerService } from './mouse-handler.service';

const IMAGES_PATH = 'assets/images/';

export class SocketManager {
    private sio: io.Server;
    // private room: string = "serverRoom";
    public socket: io.Socket;
    private timeInterval: NodeJS.Timer;
    private chronometerService: ChronometerService = new ChronometerService();
    private mouseHandlerService = Container.get(MouseHandlerService);
    private gamesService = new GamesService();

    constructor(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] }, maxHttpBufferSize: 1e7 });
    }

    public handleSockets(): void {
        this.sio.on('connection', (socket) => {
            console.log(`Connexion par l'utilisateur avec id : ${socket.id}`);
            this.socket = socket;
            // message initial
            socket.emit('hello', 'Hello World!');

            socket.on('message', (message: string) => {
                console.log(message);
            });

            // socket.on('validate', (word: string) => {
            //     const isValid = word.length > 5;
            //     socket.emit('wordValidated', isValid);
            // })

            // socket.on('broadcastAll', (message: string) => {
            //     this.sio.sockets.emit("massMessage", `${socket.id} : ${message}`)
            // })

            // socket.on('joinRoom', () => {
            //     socket.join(this.room);
            // });

            // socket.on('roomMessage', (message: string) => {
            //     // Seulement un membre de la salle peut envoyer un message aux autres
            //     if (socket.rooms.has(this.room)) {
            //         this.sio.to(this.room).emit("roomMessage", `${socket.id} : ${message}`);
            //     }
            // });

            socket.on('disconnect', (reason) => {
                console.log(`Deconnexion par l'utilisateur avec id : ${socket.id}`);
                console.log(`Raison de deconnexion : ${reason}`);
            });

            socket.on('game page', async (message: string) => {
                console.log(message);
                socket.emit('classic mode');
                socket.emit('The game is', message);
                this.timeInterval = setInterval(() => {
                    this.emitTime(socket);
                }, 1000);

                await this.sendImagesToClient(message, socket);

                //socket.emit('images', this.getImages(message));
            });

            socket.on('kill the timer', () => {
                clearInterval(this.timeInterval);
                this.chronometerService.resetChrono();
            });

            socket.on('detect images difference', (imagesData: ImageDataToCompare) => {
                const differenceDetector = new DifferenceDetectorService(imagesData);
                socket.emit('game creation difference array', differenceDetector.getDifferentPixelsArrayWithOffset());
                socket.emit('game creation nb of differences', differenceDetector.getNbDifferences());
            });

            socket.on('Verify position', (position) => {
                this.clickResponse(socket, position);
            });
        });
    }

    private emitTime(socket: io.Socket) {
        this.chronometerService.increaseTime();
        console.log(this.chronometerService.time); // Là que pour debug
        socket.emit('time', this.chronometerService.time);
    }

    private clickResponse(socket: io.Socket, mousePosition: Position) {
        const clickAnswer = this.mouseHandlerService.isValidClick(mousePosition);
        socket.emit('Valid click', clickAnswer);
    }

    private async sendImagesToClient(gameName: string, socket: io.Socket) {
        const gameImagesNames: string[] = await this.gamesService.getGameImages(gameName);
        console.log(gameName, gameImagesNames);
        await this.sendImageToClientDataFromFile(IMAGES_PATH + gameImagesNames[ORIGINAL_IMAGE_POSITION], 'classic solo original image', socket);
        await this.sendImageToClientDataFromFile(IMAGES_PATH + gameImagesNames[MODIFIED_IMAGE_POSITION], 'classic solo modified image', socket);
    }

    private async sendImageToClientDataFromFile(imagePath: string, eventName: string, socket: io.Socket) {
        try {
            const imageData = await fs.promises.readFile(imagePath);
            socket.emit(eventName, 'data:image/bmp;base64,' + imageData.toString('base64'));
        } catch (err) {
            console.log('Something went wrong trying to read the image file:' + err);
            throw new Error(err);
        }
    }

    /*
    private getImages(gameName: string) {
        const originalImagePos = 0;
        const modifiedImagePos = 1;
        console.log('image test');
        return [this.getImage(gameName, originalImagePos), this.getImage(gameName, modifiedImagePos)];
    }
    private getImage(gameName: string, position: number) {
        let imageToSend: HTMLImageElement = new Image(); // erreur ici : Image is not defined
        imageToSend.src = this.getImageURL(gameName, position);
        return imageToSend;
    }

    // ajouter une fonction pour aller get les url des images dans le json
    private getImageURL(gameName: string, imagePos: number) {
        // utilise gameName pour avoir les infos sur la game
        // ensuite, utilise imagePos pour avoir limage originale ou limage modifie
        return '../../assets/image_7_diff.bmp'; // trouver l'url dans games.json si cest la qu'elles sont enregistrer
    }
    */
}
