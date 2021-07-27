import Items from '../../src/util/items';

import type Player from '../../src/game/entity/character/player/player';
import type { Item } from '.';

export default class HealthFlask implements Item {
    id: number;
    healAmount: number;
    manaAmount: number;

    constructor(id: number) {
        this.id = id;

        const customData = Items.getCustomData(this.id);

        this.healAmount = customData?.healAmount || 0;
        this.manaAmount = customData?.manaAmount || 0;
    }

    onUse(player: Player): void {
        if (this.healAmount) player.healHitPoints(this.healAmount);

        if (this.manaAmount) player.healManaPoints(this.manaAmount);
    }
}
