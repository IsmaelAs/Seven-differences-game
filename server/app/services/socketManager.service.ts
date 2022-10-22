import { GamesService } from '@app/services/local.games.service';
import { DEFAULT_GAME_ROOM_NAME, GAME_ROOM_GENERAL_ID, MODIFIED_IMAGE_POSITION, NO_OTHER_PLAYER_ROOM, ORIGINAL_IMAGE_POSITION } from '@common/const';
import { DifferencesInformations } from '@common/differences-informations';
import { GameplayDifferenceInformations } from '@common/gameplay-difference-informations';
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
    private playersCreatingAGame: Map<string, string> = new Map<string, string>();
    private playersJoiningAGame: Map<string, string[]> = new Map<string, string[]>();
    private usernamePlayers: Map<string, string> = new Map<string, string>();
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
                console.log('kesspass');
                socket.emit('classic mode');
                socket.emit('The game is', gameName);
                //If no game room to join in multiplayer :
                await this.beginGame(socket, gameName, NO_OTHER_PLAYER_ROOM);
                //else we send the room name where a player is waiting to start a multiplayer game
            });

            socket.on('is there someone waiting', (gameName: string) => {
                socket.emit(`${gameName} let me tell you if someone is waiting`, this.playersCreatingAGame.get(gameName) !== undefined);
            });

            socket.on('my username is', (username: string) => {
                socket.data.username = username;
            })

            socket.on('username is', (username: string) => {
                socket.emit('show the username', username);
            });

            socket.on('I am waiting', (gameName: string) => {
                this.playersCreatingAGame.set(gameName, socket.id);
                this.sio.emit(`${gameName} someone is waiting`);
            });

            socket.on('I left', (gameName: string) => {
                this.deleteCreatorOfGame(gameName);
                // Cette boucle for devrait être dans un service pour gérer le multijoueur du côté serveur ET le if est pt inutile
                if (this.playersJoiningAGame.get(gameName)?.length) {
                    const playersWaiting = this.playersJoiningAGame.get(gameName) as string[];
                    for (const player of playersWaiting) {
                        //Mettre ce false dans une constante appellée genre HOST_LEFT = false;
                        this.sio.to(player).emit(`${gameName} response on host presence`, false);
                    }
                }
                this.sio.emit(`${gameName} nobody is waiting no more`);
            });

            socket.on(`Is the host still there`, (gameName: string) => {
                //Utiliser la constante que j'ai dit dans la ligne 74 ici
                if(this.playersCreatingAGame.get(gameName)?.length) this.sio.to(socket.id).emit(`${gameName} response on host presence`, true);
                else this.sio.to(socket.id).emit(`${gameName} response on host presence`, false);
            });

            socket.on('I am trying to join', (gameInfoAndUsername: string[]) => {
                this.addJoiningPlayer(socket.id, gameInfoAndUsername);
                const waitingSocketId = this.playersCreatingAGame.get(gameInfoAndUsername[0]) as string;
                this.sio.to(waitingSocketId).emit(`${gameInfoAndUsername[0]} someone is trying to join`, this.getUsernameFirstPlayerWaiting(gameInfoAndUsername[0]));
            });

            socket.on('I dont want to join anymore', (gameName: string) => {
                this.deleteJoiningPlayer(socket.id, gameName);
                const waitingSocketId = this.playersCreatingAGame.get(gameName) as string;
                this.sio.to(waitingSocketId).emit(`${gameName} the player trying to join left`);
                if(this.playersJoiningAGame.get(gameName)?.length) 
                    this.sio.to(waitingSocketId).emit(`${gameName} someone is trying to join`, this.getUsernameFirstPlayerWaiting(gameName));
            });

            socket.on('launch multiplayer match', async (gameInfo: string[]) => {
                socket.emit('classic mode');
                socket.emit('The game is', gameInfo[0]);
                // const creatorUsername = this.player
                const adversarySocketId = this.getIDFirstPlayerWaiting(gameInfo[0]);
                const adversaryUsername = this.getUsernameFirstPlayerWaiting(gameInfo[0]);
                this.deleteJoiningPlayer(adversarySocketId, gameInfo[0]);
                this.deleteCreatorOfGame(gameInfo[0]);
                this.sio.to(socket.id).emit('The adversary username is', adversaryUsername);
                this.sio.to(adversarySocketId).emit('The adversary username is', socket.data.username);
                //Send a tous les gars qui attendent que le createur a choisit son adversaire A FAIRE et les reenvoyer a la page de sélection
                await this.beginGame(socket, gameInfo[0], adversarySocketId);
            });

            socket.on('I refuse this adversary', () => {

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

            socket.on('kill the game', () => {
                this.endGame(socket);
            });

            socket.on('Check if game is finished', () => {
                const mouseHandler: MouseHandlerService = this.getSocketMouseHandlerService(socket);
                if (mouseHandler.differencesNumberFound.length === mouseHandler.nbDifferencesTotal) {
                    mouseHandler.resetData();
                    this.endGame(socket);
                    socket.emit('End game');
                }
            });
        });
    }

    private async beginGame(socket: io.Socket, gameName: string, otherPlayerRoomId: string) {
        this.setupSocketRoom(socket, otherPlayerRoomId);
        this.setupNecessaryGameServices(socket);

        await this.getSocketMouseHandlerService(socket).generateDifferencesInformations(gameName);
        await this.sendImagesToClient(gameName, socket);
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
                this.emitTime(socket, this.getSocketChronometerService(socket));
            }, 1000),
        );
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
        let gameRoomName = DEFAULT_GAME_ROOM_NAME;
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
        const differencesInfo: GameplayDifferenceInformations = this.getSocketMouseHandlerService(socket).isValidClick(mousePosition);
        differencesInfo.playerName = socket.data.username;
        socket.emit('Valid click', differencesInfo);
    }

    private async sendImagesToClient(gameName: string, socket: io.Socket) {
        const gameImagesData: string[] = await this.gamesService.getGameImagesData(gameName);

        socket.emit('classic solo images', [gameImagesData[ORIGINAL_IMAGE_POSITION], gameImagesData[MODIFIED_IMAGE_POSITION]]);
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
        return this.chronometerServices.get(gameRoomName)!;
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

    // Cette méthode devrait-elle être dans un service?
    private addJoiningPlayer(socketId: string, gameInfo: string[]) {
        this.addJoiningPlayerId(socketId, gameInfo[0]);
        this.addJoiningPlayerUsername(socketId, gameInfo[1]);
    }

    private addJoiningPlayerId(socketId: string, gameName: string) {
        let playersTryingToJoin: string[] = [];
        if(this.playersJoiningAGame.get(gameName)) {
            playersTryingToJoin = this.playersJoiningAGame.get(gameName) as string[];
            playersTryingToJoin.push(socketId);
            this.playersJoiningAGame.delete(gameName);
        }
        else {
            playersTryingToJoin.push(socketId);
        }
        this.playersJoiningAGame.set(gameName, playersTryingToJoin);
    }

    private addJoiningPlayerUsername(socketId: string, username: string) {
        this.usernamePlayers.set(socketId, username);
    }

    private deleteJoiningPlayer(socketId: string, gameName: string) {
        this.deleteJoiningPlayerUsername(socketId);
        this.deleteJoiningPlayerId(socketId, gameName);
    }

    private deleteJoiningPlayerUsername(socketId: string) {
        this.usernamePlayers.delete(socketId);
    }

    private deleteJoiningPlayerId(socketId: string, gameName: string) {
        let playersTryingToJoin = this.playersJoiningAGame.get(gameName) as string[];
        playersTryingToJoin = playersTryingToJoin?.filter(id => id !== socketId);
        this.playersJoiningAGame.delete(gameName);
        this.playersJoiningAGame.set(gameName, playersTryingToJoin);
    }

    private getIDFirstPlayerWaiting(gameName: string) {
        let playersWaiting = this.playersJoiningAGame.get(gameName) as string[];
        let idWanted = playersWaiting.shift() as string;
        playersWaiting.unshift(idWanted);
        return idWanted;      
    }

    private getUsernameFirstPlayerWaiting(gameName: string) {
        return this.getUsernamePlayer(this.getIDFirstPlayerWaiting(gameName));
    }

    private deleteCreatorOfGame(gameName: string) {
        this.playersCreatingAGame.delete(gameName);
    }

    private getUsernamePlayer(socketId: string) {
        return this.usernamePlayers.get(socketId) as string;
    }
}
