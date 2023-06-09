import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChatMessagesService } from '@app/services/chat-messages.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ChatMessage } from '@common/chat-message';
import { DEFAULT_USERNAME, GAME_MESSAGE_SENDER_NAME } from '@common/const';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-chat-section',
    templateUrl: './chat-section.component.html',
    styleUrls: ['./chat-section.component.scss'],
})
export class ChatSectionComponent implements OnInit, OnDestroy {
    @ViewChild('scrollMe') private myScrollContainer: ElementRef;
    @ViewChild('playerMsg') playerMsg: ElementRef;

    message: string;
    public messagesSent: ChatMessage[];
    public localPlayerUsername: string = DEFAULT_USERNAME;
    public readonly gameMessageSenderName = GAME_MESSAGE_SENDER_NAME;
    private chatMessagesSubscription: Subscription;
    public isMultiplayerGame: boolean;

    constructor(private chatMessagesService: ChatMessagesService, private socketService: SocketClientService) {
        this.messagesSent = [];
    }

    sendMessage(): void {
        this.chatMessagesService.sendMessage(this.localPlayerUsername, this.playerMsg.nativeElement.value);
        this.playerMsg.nativeElement.value = '';
        this.scrollToBottom();
    }

    ngOnInit(): void {
        this.socketService.connect();
        this.configureSocket();
        this.chatMessagesSubscription = this.chatMessagesService.messagesObservable.subscribe({
            next: (message: ChatMessage) => {
                this.addMessage(message);
                this.scrollToBottom();
            },
        });
    }

    ngOnDestroy(): void {
        this.chatMessagesSubscription.unsubscribe();
        this.chatMessagesService.resetIsMultiplayer();
    }

    private scrollToBottom(): void {
        setTimeout(() => {
            this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        }, 2);
    }

    private addMessage(messageToAdd: ChatMessage) {
        this.messagesSent.push(messageToAdd);
    }

    private configureSocket() {
        this.socketService.on('show the username', (username: string) => {
            this.localPlayerUsername = username;
        });
        this.socketService.on('The adversary username is', (adversaryName: string) => {
            this.isMultiplayerGame = true;
        });
    }
}
