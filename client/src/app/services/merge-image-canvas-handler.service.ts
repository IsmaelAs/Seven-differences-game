import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MergeImageCanvasHandlerService {
  private canvas: HTMLCanvasElement[];
  private context:CanvasRenderingContext2D[] | null;
  private imageDownloaded: HTMLImageElement[];
  constructor() {
    this.canvas = []
    this.context = [];
    this.imageDownloaded = [new Image(),new Image()]
   }

  setLeftContextAndCanvas(context:CanvasRenderingContext2D,canvas:HTMLCanvasElement ){
    this.context!.push(context);
    this.canvas.push(canvas);

  }

  setRightContextAndCanvas(context:CanvasRenderingContext2D,canvas:HTMLCanvasElement ){
    this.context!.push(context);
    this.canvas.push(canvas);

  }

  async initializeImage(url : string, index:number){
    this.imageDownloaded[index].src = url;
    await this.waitForImageToLoad(this.imageDownloaded[index])
  }

  async waitForImageToLoad(imageToLoad: HTMLImageElement) {
    return new Promise((resolve, reject) => {
        imageToLoad.onload = () => resolve(imageToLoad);
        imageToLoad.onerror = (error) => reject(console.log(error));
    });
}

  drawImageOnCanvas(index:number){
    this.context![index].globalAlpha = 0.00;
    this.context![index].drawImage(this.imageDownloaded[index], 0, 0);
    this.context![index].globalAlpha = 1.00;
  }


  obtainUrlForMerged(index:number){
    return this.canvas[index].toDataURL();
  }


}