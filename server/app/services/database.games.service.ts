import { Collection, Filter, ModifyResult, UpdateFilter, WithId } from 'mongodb';
//import { Time } from '../../../common/time';
import { HttpException } from '@app/classes/http.exception';
import { GameTimes } from '@common/game-times';
import { GameModeTimes } from '@common/games-record-times';
import 'dotenv/config';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

@Service()
export class RecordTimesService {
    constructor(private databaseService: DatabaseService) {}

    get collection(): Collection<GameTimes> {
        return this.databaseService.database.collection(process.env.DATABASE_COLLECTION!);
    }

    // async getAllGames(): Promise<Game[]> {
    //   return this.collection
    //     .find({})
    //     .toArray()
    //     .then((game: Game[]) => {
    //       return game;
    //     });
    // }

    async getGame(nameOfWantedGame: string): Promise<GameTimes> {
        return this.collection.findOne({ name: nameOfWantedGame }).then((game: WithId<GameTimes>) => {
            if (game) {
                return game;
            }
            throw new HttpException('Game not found', StatusCodes.NOT_FOUND);
        });
    }

    async addNewGameDefaultTimes(gameName: string): Promise<void> {
        const newGameDefaultTimes: GameTimes = {
            name: gameName,
            recordTimes: this.databaseService.defaultRecordTimes,
        };
        if (await this.validateName(gameName)) {
            await this.collection.insertOne(newGameDefaultTimes).catch((error: Error) => {
                throw new HttpException('Failed to insert game and default times', StatusCodes.INTERNAL_SERVER_ERROR);
            });
        } else {
            throw new Error('Game already exists');
        }
    }

    async deleteGameRecordTimes(nameOfWantedGame: string): Promise<void> {
        return this.collection
            .findOneAndDelete({ name: nameOfWantedGame })
            .then((res: ModifyResult<GameTimes>) => {
                if (!res.value) {
                    throw new HttpException('Could not find game', StatusCodes.NOT_FOUND);
                }
            })
            .catch(() => {
                throw new HttpException('Failed to delete game record times', StatusCodes.INTERNAL_SERVER_ERROR);
            });
    }

    async resetGameRecordTimes(gameName: string): Promise<void> {
        let filterQuery: Filter<GameTimes> = { name: gameName };
        let updateQuery: UpdateFilter<GameTimes> = {
            $set: { recordTimes: this.databaseService.defaultRecordTimes },
        };
        return this.collection
            .updateOne(filterQuery, updateQuery)
            .then(() => {})
            .catch(() => {
                throw new Error('Failed to reset the game record times');
            });
    }

    async resetAllGamesRecordTimes(): Promise<void> {
        let updateQuery: UpdateFilter<GameTimes> = {
            $set: { recordTimes: this.databaseService.defaultRecordTimes },
        };
        return this.collection
            .updateMany({}, updateQuery)
            .then(() => {})
            .catch(() => {
                throw new Error('Failed to reset all games record times');
            });
    }

    async updateGameRecordTimes(gameName: string, newRecordTimes: GameModeTimes): Promise<void> {
        let filterQuery: Filter<GameTimes> = { name: 'Plane game' };
        let updateQuery: UpdateFilter<GameTimes> = {
            $set: { recordTimes: newRecordTimes },
        };
        return this.collection
            .updateOne(filterQuery, updateQuery)
            .then(() => {})
            .catch(() => {
                throw new Error('Failed to reset this game record times');
            });
    }

    // async modifyGame(game: Game): Promise<void> {
    //   let filterQuery: Filter<Game> = { name: game.name };
    //   let updateQuery: UpdateFilter<Game> = {
    //     $set: {
    //       name: game.name,
    //       numberOfDifferences: game.numberOfDifferences,
    //       times: game.times,
    //       images: game.images,
    //     },
    //   };
    //   return this.collection
    //   .updateOne(filterQuery, updateQuery)
    //   .then(() => { })
    //   .catch(() => {
    //     throw new Error('Failed to update game');
    //   });
    // }

    // async addNewTimeToGame(newTime: Time, nameOfWantedGame: string): Promise<void> {
    //     let modifiedGame = await this.getGame(nameOfWantedGame);
    //     modifiedGame.times.push(newTime);
    //     this.modifyGame(modifiedGame);
    // }

    async getGameTimes(nameOfWantedGame: string): Promise<GameModeTimes> {
        // let filterQuery: Filter<GameTimes> = { name: nameOfWantedGame };
        // let projection: FindOptions = { projection: { recordTimes: 1, _id: 0 } };
        const times = await this.collection.findOne({ name: 'Plane game' });
        return times!.recordTimes;
        // return this.collection
        //     .findOne(filterQuery, projection)
        //     .then((gameTimes: WithId<GameTimes>) => {
        //         return gameTimes.recordTimes;
        //     })
        //     .catch(() => {
        //         throw new Error('Failed to get the game times');
        //     });
    }

    async sortGameTimes(gameName: string, isMultiplayer: boolean): Promise<void> {
        if (!isMultiplayer) {
            return this.collection
                .updateOne({ name: 'Plane game' }, { $push: { 'recordTimes.soloGameTimes': { $each: [], $sort: { time: 1 } } } })
                .then(() => {})
                .catch(() => {
                    throw new Error('Failed to sort the solo game record times');
                });
        } else {
            return this.collection
            .updateOne({ name: 'Plane game' }, { $push: { 'recordTimes.multiplayerGameTimes': { $each: [], $sort: { time: 1 } } } })
            .then(() => {})
            .catch(() => {
                throw new Error('Failed to sort the multiplayer game record times');
            });
        }
    }

    // async updateRecordTimes(gameName: string, isMultiplayer: boolean, newTime: string, newUsername: string): Promise<void> {
    //     //   let filterQuery: Filter<GameTimes> = { name: gameName };

    //     //   let updateQuery: UpdateFilter<GameTimes>
    //     //   if (isItMultiplayer) {
    //     //     updateQuery = {
    //     //     $set: {
    //     //       recordTimes:
    //     //     },
    //     //   }};
    //     if (isMultiplayer) {
    //         return this.collection.findOneAndUpdate(
    //             { name: gameName },
    //             {
    //                 $set: {
    //                     ""
    //                     // [`recordTimes.multiplayerGameTimes.${2}.time`]: newTime,
    //                     // [`recordTimes.multiplayerGameTimes.${2}.playerName`]: newUsername,
    //                 },
    //             },
    //         );
    //     }
    // }

    // private validateTimes(times: Time[]): boolean {
    //     return times.length === 0;
    // }

    private async validateName(gameName: string): Promise<boolean> {
        let filterQuery: Filter<GameTimes> = { name: gameName };
        const game = await this.collection.findOne(filterQuery);
        return game?.name !== gameName;
    }
}
