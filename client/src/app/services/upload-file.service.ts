import { Injectable } from '@angular/core';

import { CommunicationService } from './communication.service';
@Injectable({
    providedIn: 'root',
})
export class UploadFileService {
    private nameOriginalImage: File;
    private nameModifiedImage: File;
    nameOfGame: string;
    nameOfImageToUploadOriginal: string;
    nameOfImageToUploadModified: string;
    constructor(private communicationService: CommunicationService) {}

    getNameOriginalImage() {
        return this.nameOriginalImage;
    }

    setOriginalImage(file: File) {
        this.nameOriginalImage = file;
    }

    getNameModifiedImage() {
        return this.nameModifiedImage;
    }

    setModifiedImage(file: File) {
        this.nameModifiedImage = file;
    }

    setNameGame(nameGame: string) {
        this.nameOfGame = nameGame;
    }

    setOriginalMergedCanvasImage(orignalImageMerged: HTMLImageElement) {
        const nameImage = this.getNameOriginalImage().name;
        const blobImage = this.dataURItoBlob(orignalImageMerged.src);
        this.setOriginalImage(new File([blobImage], nameImage));
    }

    dataURItoBlob(dataURI: string) {
        let byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0) byteString = atob(dataURI.split(',')[1]);
        else byteString = unescape(dataURI.split(',')[1]);

        let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        let byteBuffer = new Uint8Array(byteString.length);
        for (var index = 0; index < byteString.length; index++) {
            byteBuffer[index] = byteString.charCodeAt(index);
        }

        return new Blob([byteBuffer], { type: mimeString });
    }

    async setModifiedMergedCanvasImage(modifiedImageMerged: HTMLImageElement) {
        const nameImage = this.getNameModifiedImage().name;
        const blobImage = this.dataURItoBlob(modifiedImageMerged.src);
        this.setModifiedImage(new File([blobImage], nameImage, { type: 'image/jpeg' }));
    }

    setNameImageUpload(indexImage: number) {
        if (indexImage == 0) {
            this.nameOfImageToUploadOriginal = this.nameOfGame + '_' + indexImage + '_' + this.getNameOriginalImage().name;
        } else if (indexImage == 1) {
            this.nameOfImageToUploadModified = this.nameOfGame + '_' + indexImage + '_' + this.getNameModifiedImage().name;
        }
    }

    getNameImageUpload(index: number) {
        if (index == 0) {
            return this.nameOfImageToUploadOriginal;
        } else if (index == 1) {
            return this.nameOfImageToUploadModified;
        } else return;
    }

    upload(file: File, indexImage: number) {
        const formData = new FormData();
        formData.append('file', file, this.getNameImageUpload(indexImage));

        this.communicationService.uploadFiles(formData).subscribe((e) => {
            console.log(e);
        });
    }
}
