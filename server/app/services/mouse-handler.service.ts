import { ImageDataToCompare } from '@common/image-data-to-compare';
import { Position } from '@common/position';
import { Service } from 'typedi';
import { DifferenceDetectorService } from './difference-detector.service';

@Service()
export class MouseHandlerService {
    differencesHashmap: Map<number, number>;
    differencesNumberFound: Array<number>;
    imagesData: ImageDataToCompare;

    constructor() {
        this.differencesHashmap = new Map<number, number>();
        this.differencesNumberFound = [];
    }

    updateImageData(imagesData: ImageDataToCompare) {
        this.imagesData = imagesData;
        this.generateDifferencesHashmap();
    }

    resetData() {
        this.differencesHashmap = new Map<number, number>();
        this.differencesNumberFound = [];
    }

    isValidClick(mousePosition: Position): boolean {
        console.log(mousePosition);

        return this.validateDifferencesOnClick(mousePosition);
    }

    generateDifferencesHashmap() {
        this.differencesHashmap = new DifferenceDetectorService(this.imagesData).getPixelsDifferencesNbMap();
    }

    convertMousePositionToPixelNumber(mousePosition: Position): number {
        return (mousePosition.y + 1) * this.imagesData.imageWidth + mousePosition.x - this.imagesData.imageWidth;
    }

    validateDifferencesOnClick(mousePosition: Position): boolean {
        const pixelNumber = this.convertMousePositionToPixelNumber(mousePosition);
        let differencesNumber: number;
        let pixelIsDifferent: boolean = true;

        if (this.differencesHashmap.has(pixelNumber)) {
            differencesNumber = this.differencesHashmap.get(pixelNumber)!;

            if (this.differencesNumberFound.includes(differencesNumber)) {
                // La différence a déjà été trouvée précédemment
                return !pixelIsDifferent;
            } else {
                // Nouvelle Différence trouvée
                this.differencesNumberFound.push(differencesNumber);
                console.log(this.differencesNumberFound);
                return pixelIsDifferent;
            }
        } else {
            // Afficher Erreur et suspendre/ignorer les clics pendant 1s
            return !pixelIsDifferent;
        }
    }
}
