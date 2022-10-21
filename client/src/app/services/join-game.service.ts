import { Injectable } from '@angular/core';
import { SocketClientService } from './socket-client.service';

@Injectable({
  providedIn: 'root'
})
export class JoinGameService {

  constructor(private socketService: SocketClientService) { }

  public joinGame(gameInfo: any) {
    this.socketService.send('I am trying to join', gameInfo);
  }

  public leaveJoiningProcess(gameName: string) {
    this.socketService.send('I dont want to join anymore', gameName);
  }

}