import Player from '../player';

import log from '@kaetram/common/util/log';

import { Modules } from '@kaetram/common/network';
import { RawAbility, AbilityData } from '@kaetram/common/types/ability';

import Data from '../../../../../../data/abilities.json';

type DeactivateCallback = (player: Player) => void;
type LevelCallback = (key: string, level: number) => void;
export default class Ability {
    private data: RawAbility;

    private lastActivated = 0;

    private deactivateCallback?: DeactivateCallback;
    private levelCallback?: LevelCallback;

    public constructor(public key: string, private level = 1, private quickSlot = false) {
        this.data = (Data as RawAbility)[this.key];
    }

    /**
     * Superclass implementation for when an ability is activated.
     * @param player The player object that activated the ability.
     */

    public activate(player: Player): void {
        // Passive abilities are not activated.
        if (this.data.type !== 'active' || !this.data.levels) return;

        let { cooldown, duration, mana } = this.data.levels[this.level];

        // Someone somewhere forgot to specify a mana cost for the ability.
        if (!mana) return log.warning(`Ability ${this.key} has no mana cost.`);

        // Ensure active abilities have a cooldown and duration.
        if (!cooldown || !duration)
            return log.warning(`Ability ${this.key} has no cooldown or duration.`);

        // Player doesn't have enough mana.
        if (player.mana.getMana() < mana)
            return player.notify('You do not have enough mana to use this ability.');

        // Ensure the ability is not on cooldown.
        if (this.isCooldown(cooldown))
            return player.notify(
                `You need to wait ${Math.floor(
                    cooldown - (Date.now() - this.lastActivated)
                )} seconds before using this ability again.`
            );

        // Remove the ability mana cost from the player.
        player.mana.decrement(mana);

        // Ability will deactivate and create a callback after `duration` milliseconds.
        setTimeout(() => this.deactivateCallback?.(player), duration);

        // Update the date of the last time the ability was activated.
        this.lastActivated = Date.now();
    }

    /**
     * Ensures the integrity of the ability data.
     * @returns True if the ability data exists, false otherwise.
     */

    public isValid(): boolean {
        return !!this.data;
    }

    /**
     * Checks if the ability is still in cooldown.
     * @param cooldown The cooldown integer value of an ability.
     * @returns Whether or not the ability is still in cooldown.
     */

    private isCooldown(cooldown: number): boolean {
        return Date.now() - this.lastActivated < cooldown;
    }

    public getType(): Modules.AbilityType {
        return this.data.type === 'active'
            ? Modules.AbilityType.Active
            : Modules.AbilityType.Passive;
    }

    /**
     * Sets the level of the ability and creates a callback.
     * @param level The new level of the ability.
     */

    public setLevel(level: number): void {
        // Ability levels range from 1-4.
        if (level < 1) level = 1;
        if (level > 4) level = 4;

        this.level = level;

        this.levelCallback?.(this.key, level);
    }

    /**
     * Serializes the ability's information into an AbilityData object.
     * @param includeType Includes the ability type in the serialized object.
     * @returns An AbilityData object containing necessary data for database storage.
     */

    public serialize(includeType = false): AbilityData {
        let data: AbilityData = {
            key: this.key,
            level: this.level,
            quickSlot: this.quickSlot
        };

        if (includeType) data.type = this.getType() as number;

        return data;
    }

    /**
     * Callback for when the ability has been deactivated.
     * @param callback Contains the player parameter.
     */

    public onDeactivate(callback: DeactivateCallback): void {
        this.deactivateCallback = callback;
    }

    /**
     * Callback for when the ability has been leveled up.
     * @param callback Contains the key and level parameters.
     */

    public onLevel(callback: LevelCallback): void {
        this.levelCallback = callback;
    }
}
