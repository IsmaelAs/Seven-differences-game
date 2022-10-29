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
import { WaitingLineHandlerService } from './waitingLineHandler.service';

export class SocketManager {
    private sio: io.Server;
    // private room: string = "serverRoom";
    public socket: io.Socket;
    private waitingLineHandlerService: WaitingLineHandlerService = new WaitingLineHandlerService();
    private gameManagerService: GameManagerService;

    constructor(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] }, maxHttpBufferSize: 1e7 });
        this.gameManagerService = new GameManagerService(this.sio);
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
<<<<<<< Updated upstream
                console.log('creation createur');
=======
>>>>>>> Stashed changes
                this.waitingLineHandlerService.addCreatingPlayer(gameName, socket.id);
                this.sio.emit(`${gameName} let me tell you if someone is waiting`, true);
            });

            socket.on('Reload game selection page', (msg) => {
                this.sio.emit('Page reloaded', msg);
            });

            socket.on('I left', (gameName: string) => {
                this.waitingLineHandlerService.deleteCreatorOfGame(gameName);
<<<<<<< Updated upstream
                this.waitingLineHandlerService.sendEventToAllJoiningPlayers(this.sio, gameName, 'response on host presence');
                this.sio.emit(`${gameName} nobody is waiting no more`);
=======
                this.waitingLineHandlerService.sendEventToAllJoiningPlayers(this.sio, gameName, 'response on host presence')
                this.sio.emit(`${gameName} let me tell you if someone is waiting`, false);
>>>>>>> Stashed changes
            });

            socket.on('need reconnection', () => {
                this.sio.to(socket.id).emit('reconnect');
            });

            socket.on(`Is the host still there`, (gameName: string) => {
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
                this.gameManagerService.endGame(socket);
            });

            socket.on('Check if game is finished', () => {
                const mouseHandler: MouseHandlerService = this.gameManagerService.getSocketMouseHandlerService(socket);
                if (mouseHandler.getNumberOfDifferencesFoundByPlayer(socket.id) === mouseHandler.nbDifferencesTotal) {
                    mouseHandler.resetData();
                    this.gameManagerService.endGame(socket);
                    socket.emit('End game');
                }
            });

            socket.on('playerMessage', (msg: ChatMessage) => {
                console.log(msg);
                //Change socket.id by gameroom name
                this.sio.to(socket.id).emit('Send message to opponent', msg);
            });
        });
    }
<<<<<<< Updated upstream
}
=======

    private async beginGame(socket: io.Socket, gameName: string) {
        this.setupSocketGameRoom(socket, NO_OTHER_PLAYER_ROOM);
        this.setupNecessaryGameServices(socket);

        await this.getSocketMouseHandlerService(socket).generateDifferencesInformations(gameName);
        this.getSocketMouseHandlerService(socket).addPlayerToGame(socket.id);
        await this.sendImagesToClient(gameName, socket);
    }

    //To test
    private async startMultiplayerMatch(socket: io.Socket, adversarySocketId: string, gameName: string) {
        await this.beginGame(socket, gameName);

        const adversarySocket = this.waitingLineHandlerService.getSocketByID(adversarySocketId, this.sio);
        const gameRoomName = this.findSocketGameRoomName(socket);
        this.setupSocketGameRoom(adversarySocket, gameRoomName);
        this.getSocketMouseHandlerService(adversarySocket).addPlayerToGame(adversarySocketId);

        adversarySocket.emit(`${gameName} you have been accepted`);
        socket.emit('The adversary username is', adversarySocket.data.username);
        adversarySocket.emit('The adversary username is', socket.data.username);

        this.sio.to(gameRoomName).emit('classic mode');
        this.sio.to(gameRoomName).emit('The game is', gameName);
    }

    private setupNecessaryGameServices(socket: io.Socket) {
        const mouseHandler: MouseHandlerService = new MouseHandlerService();
        const chronometerService: ChronometerService = new ChronometerService();

        const gameRoomName = this.findSocketGameRoomName(socket);

        this.chronometerServices.set(gameRoomName, chronometerService);
        this.mouseHandlerServices.set(gameRoomName, mouseHandler);
        this.timeIntervals.set(
            gameRoomName,
            setInterval(() => {
                this.emitTime(this.getSocketChronometerService(socket), gameRoomName);
            }, 1000),
        );
    }

    private setupSocketGameRoom(socket: io.Socket, otherPlayerGameRoomId: string) {
        const playerGameRoomID = socket.id + GAME_ROOM_GENERAL_ID;

        if (otherPlayerGameRoomId === NO_OTHER_PLAYER_ROOM && !socket.rooms.has(playerGameRoomID)) {
            socket.join(playerGameRoomID);
        } else {
            socket.join(otherPlayerGameRoomId);
        }
    }

    private findSocketGameRoomName(socket: io.Socket): string {
        let gameRoomName = DEFAULT_GAME_ROOM_NAME;
        socket.rooms.forEach((roomName: string) => {
            if (roomName.includes(GAME_ROOM_GENERAL_ID)) {
                gameRoomName = roomName;
            }
        });

        return gameRoomName;
    }

    private emitTime(chronometerService: ChronometerService, gameRoomName: string) {
        chronometerService.increaseTime();
        this.sio.to(gameRoomName).emit('time', chronometerService.time);
    }

    private clickResponse(socket: io.Socket, mousePosition: Position) {
        const differencesInfo: GameplayDifferenceInformations = this.getSocketMouseHandlerService(socket).isValidClick(mousePosition, socket.id);
        differencesInfo.playerName = socket.data.username;
        this.sio.to(this.findSocketGameRoomName(socket)).emit('Valid click', differencesInfo);
    }

    private async sendImagesToClient(gameName: string, socket: io.Socket) {
        const gameImagesData: string[] = await this.gamesService.getGameImagesData(gameName);

        this.sio
            .to(this.findSocketGameRoomName(socket))
            .emit('classic solo images', [gameImagesData[ORIGINAL_IMAGE_POSITION], gameImagesData[MODIFIED_IMAGE_POSITION]]);
    }

    private endGame(socket: io.Socket) {
        const gameRoomName: string = this.findSocketGameRoomName(socket);
        this.endChrono(socket);
        this.chronometerServices.delete(gameRoomName);
        this.mouseHandlerServices.delete(gameRoomName);
        this.timeIntervals.delete(gameRoomName);
        socket.rooms.delete(gameRoomName);
    }

    private getSocketChronometerService(socket: io.Socket): ChronometerService {
        const gameRoomName = this.findSocketGameRoomName(socket);
        return this.chronometerServices.get(gameRoomName) as ChronometerService;
    }

    private getSocketMouseHandlerService(socket: io.Socket): MouseHandlerService {
        const gameRoomName = this.findSocketGameRoomName(socket);
        return this.mouseHandlerServices.get(gameRoomName)!;
    }

    private getSocketTimeInterval(socket: io.Socket): NodeJS.Timer {
        const gameRoomName = this.findSocketGameRoomName(socket);
        return this.timeIntervals.get(gameRoomName)!;
    }

    private endChrono(socket: io.Socket) {
        clearInterval(this.getSocketTimeInterval(socket));
        this.getSocketChronometerService(socket)?.resetChrono();
    }
}
>>>>>>> Stashed changes
