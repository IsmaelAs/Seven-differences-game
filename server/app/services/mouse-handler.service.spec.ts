import { FIRST_ARRAY_POSITION, NO_DIFFERENCE_FOUND_ARRAY } from '@common/const';
import { Game } from '@common/game';
import { GameplayDifferenceInformations } from '@common/gameplay-difference-informations';
import { Position } from '@common/position';
import { expect } from 'chai';
import * as sinon from 'sinon';
import Container from 'typedi';
import { HashmapConverterService } from './hashmap-converter.service';
import { GamesService } from './local.games.service';
import { MouseHandlerService } from './mouse-handler.service';

describe('MouseHandlerService', () => {
    const testGameName = 'name';
    const testSocketID = 'socket1';
    const testGame: Game = {
        name: testGameName,
        numberOfDifferences: 2,
        times: [],
        images: ['image1', 'image2'],
        differencesList: [
            [599, 666],
            [899, 951],
        ],
    };
    const testDifferencesFoundArray: number[] = [1, 2, 3];
    const testDifferencesList: number[][] = [[0]];
    const hashmapConverter: HashmapConverterService = Container.get(HashmapConverterService);

    let mouseService: MouseHandlerService;
    let position: Position = { x: 0, y: 0 };

    before(() => {
        sinon.stub(GamesService.prototype, 'getGame').callsFake(async (gameName: string) => {
            return Promise.resolve(testGame);
        });
    });

    beforeEach(async () => {
        mouseService = new MouseHandlerService();
        mouseService['differencesHashmap'].set(0, 0);
        mouseService['differencesList'] = testDifferencesList;
        mouseService.addPlayerToGame(testSocketID);
        position = { x: 0, y: 0 };
    });

    after(() => {
        sinon.restore();
    });

    it('should call generateDifferencesInformations on updateImageData', () => {
        const spy = sinon.spy(mouseService, <any>'generateDifferencesInformations');
        expect(spy.called);
    });

    it('should set the differences list at the right value when generateDifferencesInformations() is called', async () => {
        await mouseService.generateDifferencesInformations(testGameName);
        expect(mouseService['differencesList']).to.deep.equals(testGame.differencesList);
    });

    it('should change the differencesMap value when generateDifferencesInformations() is called', async () => {
        const originalDifferencesMap = mouseService['differencesHashmap'];
        await mouseService.generateDifferencesInformations(testGameName);
        expect(mouseService['differencesHashmap']).to.not.deep.equals(originalDifferencesMap);
    });

    it('should call convertNumber2DArrayToNumberMap() from hashmapConverter when generateDifferencesInformations() is called', async () => {
        const spy = sinon.spy(hashmapConverter, 'convertNumber2DArrayToNumberMap');
        await mouseService.generateDifferencesInformations(testGameName);
        expect(spy.called);
    });

    it('should return an empty array if difference is already found and return false for isValidDifferenceFound', () => {
        mouseService['differencesNbFoundByPlayer'].set(testSocketID, [FIRST_ARRAY_POSITION]);
        const differencesInfo: GameplayDifferenceInformations = mouseService.isValidClick(position, testSocketID);
        expect(differencesInfo.differencePixelsNumbers).to.be.deep.equals(NO_DIFFERENCE_FOUND_ARRAY);
        expect(differencesInfo.isValidDifference).to.equal(false);
    });

    it('should not return an empty array if difference is not already found and return true for isValidDifferenceFound', () => {
        const differencesInfo: GameplayDifferenceInformations = mouseService.isValidClick(position, testSocketID);
        expect(differencesInfo.differencePixelsNumbers).to.not.be.deep.equals(NO_DIFFERENCE_FOUND_ARRAY);
        expect(differencesInfo.isValidDifference).to.equal(true);
    });

    it('should return an empty array if pixel is not a difference and return false for isValidDifferenceFound', () => {
        position = { x: 2, y: 2 };
        const differencesInfo: GameplayDifferenceInformations = mouseService.isValidClick(position, testSocketID);
        expect(differencesInfo.differencePixelsNumbers).to.be.deep.equals(NO_DIFFERENCE_FOUND_ARRAY);
        expect(differencesInfo.isValidDifference).to.equal(false);
    });

    it('should reset differencesHashmap and differencesFound array on resetData() call', () => {
        let differencesHashmapTest: Map<number, number> = new Map<number, number>();
        let differencesNbFoundByPlayerTest: Map<string, number> = new Map<string, number>();

        mouseService['differencesNbFoundByPlayer'].set(testSocketID, testDifferencesFoundArray);
        mouseService.resetData();
        expect(mouseService['differencesHashmap']).to.deep.equals(differencesHashmapTest);
        expect(mouseService['differencesNbFoundByPlayer']).to.deep.equals(differencesNbFoundByPlayerTest);
    });

    it('should add a socketID to the differencesNbFoundByPLayerMap on addPlayerToGame()', () => {
        mouseService.addPlayerToGame(testSocketID);
        expect(mouseService['differencesNbFoundByPlayer'].get(testSocketID)).to.deep.equals([]);
    });

    it('should return the number of differences found by a player on getNumberOfDifferencesFoundByPlayer()', () => {
        mouseService['differencesNbFoundByPlayer'].set(testSocketID, testDifferencesFoundArray);
        expect(mouseService.getNumberOfDifferencesFoundByPlayer(testSocketID)).to.equal(testDifferencesFoundArray.length);
    });
});
