import { MODIFIED_IMAGE_POSITION, ORIGINAL_IMAGE_POSITION } from '@common/const';
import { Game } from '@common/game';
import * as fs from 'fs';
import { join } from 'path';
import { Container, Service } from 'typedi';
import { RecordTimesService } from './database.games.service';
import { DatabaseService } from './database.service';

const IMAGES_PATH = 'assets/images/';

@Service()
export class GamesService {
    private gamesFilePath: string = 'games.json';
    private games: Game[];
    private databaseService: DatabaseService = Container.get(DatabaseService);
    private recordTimesService: RecordTimesService = new RecordTimesService(this.databaseService);

    async getGame(gameName: string): Promise<Game> {
        await this.asyncReadGamesFile();
        const game: Game = (await this.getAllGames()).find((gameNeeded) => gameNeeded.name === gameName) as Game;
        return game;
    }

    async getAllGames(): Promise<Game[]> {
        await this.asyncReadGamesFile();
        return this.games;
    }

    async generateRandomGame(gamesAlreadyPlayed: string[]): Promise<Game> {
        await this.getAllGames();
        const gamesToPlay = this.games.filter((game) => {
            return !gamesAlreadyPlayed.find((gameAlreadyPlayed) => gameAlreadyPlayed === game.name);
        });
        const max = gamesToPlay.length - 1;
        return gamesToPlay[Math.round(Math.random() * max)] as Game;
    }
    // test a finir: ligne ajoutée
    async getAllGamesWithImagesData() {
        const games: Game[] = await this.getAllGames();

        for (const game of games) {
            const gameImagesData: string[] = await this.getGameImagesData(game.name);
            game.images[ORIGINAL_IMAGE_POSITION] = gameImagesData[ORIGINAL_IMAGE_POSITION];
            game.images[MODIFIED_IMAGE_POSITION] = gameImagesData[MODIFIED_IMAGE_POSITION];
            game.times = await this.recordTimesService.getGameTimes(game.name);
        }
        return games;
    }

    async getGameImagesData(gameName: string): Promise<string[]> {
        const gameImages = await this.getGameImagesNames(gameName);
        const gameImagesData: string[] = [];

        for (let i = ORIGINAL_IMAGE_POSITION; i <= MODIFIED_IMAGE_POSITION; i++) {
            const imageDataBuffer: Buffer = await this.getGameImageData(gameImages[i]);
            gameImagesData.push('data:image/bmp;base64,' + imageDataBuffer.toString('base64'));
        }

        return gameImagesData;
    }

    async addGame(gameToAdd: Game): Promise<boolean> {
        let gameAdded = false;
        await this.asyncReadGamesFile();
        if (this.validateName(gameToAdd.name)) {
            this.games.push(gameToAdd);
            await this.asyncWriteInGamesFile();
            gameAdded = true;
        }
        return gameAdded;
    }

    validateName(name: string): boolean {
        return this.games.find((x) => x.name === name) ? false : true;
    }

    async deleteGame(nameOfGameToDelete: string) {
        await this.asyncReadGamesFile();
        const newGames = this.games.filter((game: Game) => {
            if (game.name === nameOfGameToDelete) {
                this.deleteImages(game.images[0], game.images[1]);
            }
            return game.name !== nameOfGameToDelete;
        });
        this.games = newGames;
        await this.asyncWriteInGamesFile();
        return this.games;
    }

    async resetGameList() {
        const nameList: string[] = [];
        this.games.filter((game: Game) => {
            this.deleteImages(game.images[0], game.images[1]);
            nameList.push(game.name);
        });
        this.games = [];
        await this.asyncWriteInGamesFile();
        return nameList;
    }

    async asyncWriteInGamesFile() {
        try {
            await fs.promises.writeFile(join(this.gamesFilePath), JSON.stringify({ games: this.games }), {
                flag: 'w',
            });
        } catch (err) {
            console.log('Something went wrong trying to write into the json file' + err);
            throw new Error(err);
        }
    }

    async asyncReadGamesFile() {
        try {
            const result = await fs.promises.readFile(join(this.gamesFilePath), 'utf-8');
            this.games = JSON.parse(result).games;
        } catch (err) {
            console.log('Something went wrong trying to read the json file:' + err);
            throw new Error(err);
        }
    }

    private deleteImages(image1: string, image2: string) {
        fs.rm(IMAGES_PATH + image1, () => {});
        fs.rm(IMAGES_PATH + image2, () => {});
    }

    private async getGameImagesNames(gameName: string): Promise<string[]> {
        return (await this.getGame(gameName)).images;
    }

    private async getGameImageData(imageName: string): Promise<Buffer> {
        try {
            const imageData: Buffer = await fs.promises.readFile(IMAGES_PATH + imageName);
            return imageData;
        } catch (err) {
            console.log('Something went wrong trying to read the image file:' + err);
            throw new Error(err);
        }
    }
}
