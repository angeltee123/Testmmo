import Items from '../../../../../util/items';
import * as Modules from '@kaetram/common/src/modules';
import Equipment from './equipment';

export default class Ring extends Equipment {
    public ringLevel;

    public constructor(
        name: string,
        id: number,
        count: number,
        ability: number,
        abilityLevel: number
    ) {
        super(name, id, count, ability, abilityLevel);

        this.ringLevel = Items.getRingLevel(name);
    }

    public override getBaseAmplifier(): number {
        return 1 + this.ringLevel / 100;
    }

    protected getType(): Modules.Equipment {
        return Modules.Equipment.Ring;
    }
}
