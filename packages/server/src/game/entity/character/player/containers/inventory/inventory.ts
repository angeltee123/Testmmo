import Packets from '@kaetram/common/src/packets';

import Messages from '../../../../../../network/messages';
import Container from '../container';
import Constants from './constants';

import type Item from '../../../../objects/item';
import type { ItemData } from '../../equipment/equipment';
import type Player from '../../player';

export default class Inventory extends Container {
    constructor(owner: Player, size: number) {
        super('Inventory', owner, size);
    }

    override load(
        ids: number[],
        counts: number[],
        abilities: number[],
        abilityLevels: number[]
    ): void {
        super.load(ids, counts, abilities, abilityLevels);

        this.owner.send(
            new Messages.Inventory(Packets.InventoryOpcode.Batch, [this.size, this.slots])
        );
    }

    add(item: ItemData): boolean {
        if (!this.canHold(item.id!, item.count!)) {
            this.owner.send(
                new Messages.Notification(Packets.NotificationOpcode.Text, {
                    message: Constants.InventoryFull
                })
            );
            return false;
        }

        let slot = this.addItem(item.id!, item.count!, item.ability!, item.abilityLevel!);

        if (!slot) return false;

        this.owner.send(new Messages.Inventory(Packets.InventoryOpcode.Add, slot));

        this.owner.save();

        if (item.instance) this.owner.world.entities.removeItem(item as Item);

        return true;
    }

    override remove(id: number | undefined, count: number | undefined, index?: number): boolean {
        if (!id || !count) return false;

        if (!index) index = this.getIndex(id);

        if (!super.remove(index, id, count)) return false;

        this.owner.send(
            new Messages.Inventory(Packets.InventoryOpcode.Remove, {
                index,
                count
            })
        );

        this.owner.save();

        return true;
    }
}
