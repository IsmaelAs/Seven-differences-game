/* eslint-disable prettier/prettier */

import { Component, Input, OnInit } from '@angular/core';
import { TimeService } from '@app/services/time.service';

@Component({
    selector: 'app-topbar',
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
    @Input() nbrDifferencesFound: number[];
    @Input() playerNames: string[];

    constructor(public timeService: TimeService) {}

    ngOnInit(): void {}
}
