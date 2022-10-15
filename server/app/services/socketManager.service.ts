import { GamesService } from '@app/services/local.games.service';
import { GAME_ROOM_GENERAL_ID, MODIFIED_IMAGE_POSITION, NO_OTHER_PLAYER_ROOM, ORIGINAL_IMAGE_POSITION } from '@common/const';
import { DifferencesInformations } from '@common/differences-informations';
import { ImageDataToCompare } from '@common/image-data-to-compare';
import { Position } from '@common/position';
import * as http from 'http';
import * as io from 'socket.io';
import Container from 'typedi';
import { ChronometerService } from './chronometer.service';
import { DifferenceDetectorService } from './difference-detector.service';
import { MouseHandlerService } from './mouse-handler.service';

export class SocketManager {
    private sio: io.Server;
    // private room: string = "serverRoom";
    public socket: io.Socket;
    readonly timeIntervals: Map<string, NodeJS.Timer> = new Map<string, NodeJS.Timer>();
    readonly chronometerServices: Map<string, ChronometerService> = new Map<string, ChronometerService>();
    readonly mouseHandlerServices: Map<string, MouseHandlerService> = new Map<string, MouseHandlerService>();
    private gamesService = Container.get(GamesService);

    constructor(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] }, maxHttpBufferSize: 1e7 });
    }

    public handleSockets(): void {
        this.sio.on('connection', (socket) => {
            console.log(`Connexion par l'utilisateur avec id : ${socket.id}`);
            this.socket = socket;

            socket.on('message', (message: string) => {
                console.log(message);
            });

            socket.on('disconnect', (reason) => {
                console.log(`Deconnexion par l'utilisateur avec id : ${socket.id}`);
                console.log(`Raison de deconnexion : ${reason}`);
            });

            socket.on('game page', async (gameName: string) => {
                console.log(gameName);
                socket.emit('classic mode');
                socket.emit('The game is', gameName);
                //If no game room to join in multiplayer :
                await this.beginGame(socket, gameName, NO_OTHER_PLAYER_ROOM);
                //else we send the room name where a player is waiting to start a multiplayer game
            });

            socket.on('username is', (username: string) => {
                socket.emit('show the username', username);
            });

            socket.on('detect images difference', (imagesData: ImageDataToCompare) => {
                const differenceDetector = new DifferenceDetectorService(imagesData);
                const differencesInformations: DifferencesInformations = {
                    differencesList: differenceDetector.generateDifferencesList(),
                    nbOfDifferences: differenceDetector.getNbDifferences(),
                };
                socket.emit('game creation differences informations', differencesInformations);
            });

            socket.on('Verify position', (position: Position) => {
                this.clickResponse(socket, position);
            });

            socket.on('Check if game is finished', () => {
                const mouseHandler: MouseHandlerService = this.mouseHandlerServices.get(this.findSocketGameRoomName(socket))!;
                if (mouseHandler.differencesNumberFound.length === mouseHandler.nbDifferencesTotal) {
                    mouseHandler.resetData();
                    this.endGame(socket);
                    socket.emit('End game');
                }
            });
        });
    }

    private async beginGame(socket: io.Socket, gameName: string, otherPlayerRoomId: string) {
        const mouseHandler: MouseHandlerService = new MouseHandlerService();
        const chronometerService: ChronometerService = new ChronometerService();

        this.setupSocketRoom(socket, otherPlayerRoomId);
        this.timeIntervals.set(
            this.findSocketGameRoomName(socket),
            setInterval(() => {
                this.emitTime(socket, chronometerService);
            }, 1000),
        );

        const gameRoomName = this.findSocketGameRoomName(socket);
        this.chronometerServices.set(gameRoomName, chronometerService);
        this.mouseHandlerServices.set(gameRoomName, mouseHandler);

        await mouseHandler.generateDifferencesInformations(gameName);
        await this.sendImagesToClient(gameName, socket);
    }

    private setupSocketRoom(socket: io.Socket, otherPlayerGameRoomId: string) {
        const playerGameRoomID = socket.id + GAME_ROOM_GENERAL_ID;

        if (otherPlayerGameRoomId === NO_OTHER_PLAYER_ROOM && !socket.rooms.has(playerGameRoomID)) {
            socket.rooms.add(playerGameRoomID);
        } else {
            socket.rooms.add(otherPlayerGameRoomId);
        }
    }

    private findSocketGameRoomName(socket: io.Socket): string {
        let gameRoomName = '';
        socket.rooms.forEach((roomName: string) => {
            if (roomName.includes(GAME_ROOM_GENERAL_ID)) {
                gameRoomName = roomName;
            }
        });

        return gameRoomName;
    }

    private emitTime(socket: io.Socket, chronometerService: ChronometerService) {
        chronometerService.increaseTime();
        socket.emit('time', chronometerService.time);
    }

    private clickResponse(socket: io.Socket, mousePosition: Position) {
        const clickAnswer = this.mouseHandlerServices.get(this.findSocketGameRoomName(socket))!.isValidClick(mousePosition);
        socket.emit('Valid click', clickAnswer);
    }

    private async sendImagesToClient(gameName: string, socket: io.Socket) {
        const gameImagesData: string[] = await this.gamesService.getGameImagesData(gameName);

        socket.emit('classic solo images', [gameImagesData[ORIGINAL_IMAGE_POSITION], gameImagesData[MODIFIED_IMAGE_POSITION]]);
    }

    private endGame(socket: io.Socket) {
        const gameRoomName: string = this.findSocketGameRoomName(socket);
        this.chronometerServices.delete(gameRoomName);
        this.mouseHandlerServices.delete(gameRoomName);
        this.timeIntervals.delete(gameRoomName);
        socket.rooms.delete(gameRoomName);
    }
}
