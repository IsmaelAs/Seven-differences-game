/* eslint-disable no-console */
import { HOST_CHOSE_ANOTHER, HOST_PRESENT } from '@app/server-consts';
import { ChatMessage } from '@common/chat-message';
import { DifferencesInformations } from '@common/differences-informations';
import { ImageDataToCompare } from '@common/image-data-to-compare';
import { Position } from '@common/position';
import * as http from 'http';
import * as io from 'socket.io';
import { DifferenceDetectorService } from './difference-detector.service';
import { GameManagerService } from './game-manager.service';
import { MouseHandlerService } from './mouse-handler.service';
import { WaitingLineHandlerService } from './waiting-line-handler.service';

export class SocketManager {
    socket: io.Socket;
    private sio: io.Server;
    private waitingLineHandlerService: WaitingLineHandlerService = new WaitingLineHandlerService();
    private gameManagerService: GameManagerService;

    constructor(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] }, maxHttpBufferSize: 1e7 });
        this.gameManagerService = new GameManagerService(this.sio);
    }

    handleSockets(): void {
        this.sio.on('connection', (socket: io.Socket) => {
            console.log(`Connexion par l'utilisateur avec id : ${socket.id}`);
            this.socket = socket;

            socket.on('message', (message: string) => {
                console.log(message);
            });

            socket.on('disconnect', (reason: string) => {
                console.log(`Deconnexion par l'utilisateur avec id : ${socket.id}`);
                console.log(`Raison de deconnexion : ${reason}`);
            });

            socket.on('solo classic mode', async (gameName: string) => {
                socket.emit('classic mode');
                socket.emit('The game is', gameName);
                const username = this.waitingLineHandlerService.getUsernamePlayer(socket.id, this.sio);
                socket.emit('show the username', username);
                await this.gameManagerService.beginGame(socket, gameName);
            });

            socket.on('is there someone waiting', (gameName: string) => {
                socket.emit(
                    `${gameName} let me tell you if someone is waiting`,
                    this.waitingLineHandlerService.getCreatorPlayer(gameName) !== undefined,
                );
            });

            socket.on('my username is', (username: string) => {
                if (username.charAt(0) !== ' ') {
                    this.waitingLineHandlerService.setUsernamePlayer(socket.id, username, this.sio);
                    this.sio.to(socket.id).emit('username valid');
                } else this.sio.to(socket.id).emit('username not valid');
            });

            socket.on('I am waiting', (gameName: string) => {
                this.waitingLineHandlerService.addCreatingPlayer(gameName, socket.id);
                this.sio.emit(`${gameName} let me tell you if someone is waiting`, true);
            });

            socket.on('Reload game selection page', (msg: string) => {
                let roomToKeep: string[] = [];
                for (const rooms of this.gameManagerService.getGameRooms().entries()) {
                    if (roomToKeep.length === 0)
                        rooms[1].forEach((room) => {
                            roomToKeep.push(room);
                        });
                    else roomToKeep = roomToKeep.concat(rooms[1]);
                }
                this.sio.except(roomToKeep).emit('Page reloaded', msg);
            });

            socket.on('I left', (gameName: string) => {
                this.waitingLineHandlerService.deleteCreatorOfGame(gameName);
                this.waitingLineHandlerService.sendEventToAllJoiningPlayers(this.sio, gameName, 'response on host presence');
                this.sio.emit(`${gameName} nobody is waiting no more`);
            });

            socket.on('need reconnection', () => {
                this.sio.to(socket.id).emit('reconnect');
            });

            socket.on('Is the host still there', (gameName: string) => {
                if (this.waitingLineHandlerService.getCreatorPlayer(gameName))
                    this.sio.to(socket.id).emit(`${gameName} response on host presence`, HOST_PRESENT);
                else this.sio.to(socket.id).emit(`${gameName} response on host presence`, !HOST_PRESENT);
            });

            socket.on('I am trying to join', (gameInfoAndUsername: string[]) => {
                this.waitingLineHandlerService.addJoiningPlayer(socket.id, gameInfoAndUsername);
                const waitingSocketId = this.waitingLineHandlerService.getCreatorPlayer(gameInfoAndUsername[0]) as string;
                this.sio
                    .to(waitingSocketId)
                    .emit(
                        `${gameInfoAndUsername[0]} someone is trying to join`,
                        this.waitingLineHandlerService.getUsernameFirstPlayerWaiting(gameInfoAndUsername[0], this.sio),
                    );
            });

            socket.on('I dont want to join anymore', (gameName: string) => {
                this.waitingLineHandlerService.deleteJoiningPlayer(socket.id, gameName);
                const waitingSocketId = this.waitingLineHandlerService.getCreatorPlayer(gameName) as string;
                this.sio.to(waitingSocketId).emit(`${gameName} the player trying to join left`);
                if (this.waitingLineHandlerService.getPresenceOfJoiningPlayers(gameName))
                    this.waitingLineHandlerService.updateJoiningPlayer(this.sio, gameName, 'someone is trying to join');
            });

            socket.on('launch classic mode multiplayer match', async (gameName: string) => {
                const adversarySocketId = this.waitingLineHandlerService.getIDFirstPlayerWaiting(gameName);
                this.waitingLineHandlerService.deleteJoiningPlayer(adversarySocketId, gameName);
                this.waitingLineHandlerService.deleteCreatorOfGame(gameName);
                this.waitingLineHandlerService.sendEventToAllJoiningPlayers(this.sio, gameName, 'you have been declined');
                await this.gameManagerService.startMultiplayerMatch(
                    socket,
                    this.waitingLineHandlerService.getSocketByID(adversarySocketId, this.sio),
                    gameName,
                );
                this.sio.emit(`${gameName} nobody is waiting no more`);
            });

            socket.on('I refuse this adversary', (gameName: string) => {
                const waitingSocketId = this.waitingLineHandlerService.getIDFirstPlayerWaiting(gameName);
                this.waitingLineHandlerService.deleteJoiningPlayer(waitingSocketId, gameName);
                this.sio.to(waitingSocketId).emit(`${gameName} you have been declined`, !HOST_CHOSE_ANOTHER);
                if (this.waitingLineHandlerService.getPresenceOfJoiningPlayers(gameName))
                    this.waitingLineHandlerService.updateJoiningPlayer(this.sio, gameName, 'someone is trying to join');
                else this.sio.to(socket.id).emit(`${gameName} the player trying to join left`);
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
                this.gameManagerService.clickResponse(socket, position);
            });

            socket.on('kill the game', () => {
                this.gameManagerService.handleAbandonEmit(socket);
                this.gameManagerService.endGame(socket);
            });

            socket.on('Check if game is finished', (isMultiplayer: boolean) => {
                const mouseHandler: MouseHandlerService = this.gameManagerService.getSocketMouseHandlerService(socket);
                let isGameFinished = this.gameManagerService.isGameFinishedSolo(socket);

                if (isMultiplayer) {
                    isGameFinished = this.gameManagerService.isGameFinishedMulti(socket);
                }
                if (isGameFinished) {
                    mouseHandler.resetData();
                    this.gameManagerService.handleEndGameEmits(socket, isMultiplayer);
                    this.gameManagerService.endGame(socket);
                }
            });

            socket.on('playerMessage', (msg: ChatMessage) => {
                this.sio.to(this.gameManagerService.findSocketGameRoomName(socket)).emit('Send message to opponent', msg);
            });
        });
    }
}
