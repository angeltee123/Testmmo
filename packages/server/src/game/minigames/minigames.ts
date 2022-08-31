import _ from 'lodash';

import World from '../world';
import Minigame from './minigame';
import Area from '../map/areas/area';
import Areas from '../map/areas/areas';
import Index from './impl/index';

import log from '@kaetram/common/util/log';

import { Opcodes } from '@kaetram/common/network';

/**
 * Controller for minigames, used to connect the game world to the minigames
 * and initialize them with their necessary data.
 */

export default class Minigames {
    private minigames: { [key: string]: Minigame } = {};
    private areas: Areas;

    public constructor(private world: World) {
        this.areas = this.world.map.getMinigameAreas();

        // Iterate through the minigame keys in the index and initialize them.
        _.each(
            Object.keys(Index),
            (key: string) =>
                (this.minigames[key] = new Index[key as keyof typeof Index](this.world))
        );

        log.info(
            `Finished loading ${_.size(this.minigames)} minigame${
                _.size(this.minigames) > 1 ? 's' : ''
            }.`
        );

        this.linkAreas();
    }

    /**
     * Iterates through all the areas in the area group and loads them
     * into their respective minigame.
     */

    private linkAreas(): void {
        // No areas to link, stop here.
        if (!this.areas) return;

        this.areas.forEachArea((area: Area) => {
            // No minigame found for the area.
            if (!(area.minigame in this.minigames)) return;

            this.minigames[area.minigame].loadArea(area);
        });
    }

    /**
     * Finds and returns a minigame based on the opcode.
     * @param opcode The opcode of the minigame we're looking for.
     * @returns The minigame object if found, otherwise undefined.
     */

    public get(opcode: Opcodes.Minigame): Minigame {
        switch (opcode) {
            case Opcodes.Minigame.TeamWar:
                return this.minigames.teamwar;
        }
    }
}
