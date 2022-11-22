import { RecordTimesService } from '@app/services/database.games.service';
import { GamesService } from '@app/services/local.games.service';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import Container, { Service } from 'typedi';
import { DatabaseService } from '@app/services/database.service';

@Service()
export class GamesController {
    router: Router;
    private databaseService: DatabaseService = Container.get(DatabaseService);
    private recordTimesService: RecordTimesService = new RecordTimesService(this.databaseService);

    constructor(private gamesService: GamesService) {
        gamesService = new GamesService();
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();
        this.router.get(`/`, async (req: Request, res: Response) => {
            res.json(await this.gamesService.getAllGamesWithImagesData());
        });

        this.router.post(`/newGame`, async (req: Request, res: Response) => {
            const newGame = req.body;
            if (await this.gamesService.addGame(newGame)) {
                await this.recordTimesService.addNewGameDefaultTimes(newGame.name);
                res.sendStatus(StatusCodes.CREATED);
            } else {
                res.sendStatus(StatusCodes.BAD_REQUEST);
            }
        });

        this.router.delete(`/:gameName`, async (req: Request, res: Response) => {
            res.json(await this.gamesService.deleteGame(req.params.gameName));
        });
    }
}
