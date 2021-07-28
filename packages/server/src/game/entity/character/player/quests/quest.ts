import Packets from '@kaetram/common/src/packets';

import Messages from '../../../../../network/messages';
import Utils from '../../../../../util/utils';

import type NPC from '../../../npc/npc';
import type Mob from '../../mob/mob';
import type { Door } from '../doors';
import type Player from '../player';

export interface QuestInfo {
    id: number;
    name: string;
    description: string;
    stage: number;
    finished: boolean;
}

type Task = 'click' | 'door' | 'kill' | 'talk' | 'item';

interface ItemReward {
    id: number;
    count: number;
}

export interface QuestData {
    id: number;
    name: string;
    description: string;
    npcs: number[];
    mobs?: number[];
    stages: number;
    questReq?: number[];
    itemReq?: { [key: string]: number };
    itemReward?: ItemReward;
    conversations?: { [key: string]: { [key: string]: string[] } };
    pointers?: { [key: string]: (number | string)[] };
    doors?: { [key: string]: number[] };
    task?: { [key: string]: Task };
    kill?: { [key: string]: number };
}

type NPCTalkCallback = (npc: NPC) => void;

export default abstract class Quest {
    public id;
    public name;
    public description;

    public stage = 0;

    npcTalkCallback?: NPCTalkCallback;

    constructor(public player: Player, public data: QuestData) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
    }

    load(stage: number): void {
        if (!stage) this.update();
        else this.stage = stage;
    }

    finish(): void {
        let item = this.getItemReward();

        if (item)
            if (this.hasInventorySpace(item.id, item.count))
                this.player.inventory.add({
                    id: item.id,
                    count: item.count,
                    ability: -1,
                    abilityLevel: -1
                });
            else {
                this.player.notify('You do not have enough space in your inventory.');
                this.player.notify('Please make room prior to finishing the quest.');

                return;
            }

        this.setStage(9999);

        this.player.send(
            new Messages.Quest(Packets.QuestOpcode.Finish, {
                id: this.id,
                isQuest: true
            })
        );

        this.update();
    }

    setStage(stage: number): void {
        this.stage = stage;
        this.update();
    }

    triggerTalk(npc: NPC): void {
        this.npcTalkCallback?.(npc);
    }

    update(): void {
        return this.player.save();
    }

    getConversation(id: number): string[] {
        let conversation = this.data.conversations![id];

        if (!conversation || !conversation[this.stage]) return [''];

        return conversation[this.stage];
    }

    updatePointers(): void {
        if (!this.data.pointers) return;

        let pointer = this.data.pointers[this.stage];

        if (!pointer) return;

        let [opcode] = pointer;

        if (opcode === 4)
            this.player.send(
                new Messages.Pointer(opcode, {
                    id: Utils.generateRandomId(),
                    button: pointer[1] as string
                })
            );
        else
            this.player.send(
                new Messages.Pointer(opcode, {
                    id: Utils.generateRandomId(),
                    x: pointer[1] as number,
                    y: pointer[2] as number
                })
            );
    }

    forceTalk(npc: NPC, message: string): void {
        if (!npc) return;

        this.player.talkIndex = 0;

        this.player.send(
            new Messages.NPC(Packets.NPCOpcode.Talk, {
                id: npc.instance,
                text: message
            })
        );
    }

    resetTalkIndex(): void {
        /**
         * Resets the player's talk index for the next dialogue to take place.
         */

        this.player.talkIndex = 0;
    }

    clearPointers(): void {
        this.player.send(new Messages.Pointer(Packets.PointerOpcode.Remove, {}));
    }

    onNPCTalk(callback: NPCTalkCallback): void {
        this.npcTalkCallback = callback;
    }

    hasMob(mob: Mob): boolean | undefined {
        if (!this.data.mobs) return;

        return this.data.mobs.includes(mob.id);
    }

    hasNPC(id: number): boolean {
        return this.data.npcs.includes(id);
    }

    hasItemReward(): boolean {
        return !!this.data.itemReward;
    }

    hasInventorySpace(id: number, count: number): boolean {
        return this.player.inventory.canHold(id, count);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hasDoorUnlocked(door: Door): boolean {
        return this.stage > 9998;
    }

    isFinished(): boolean {
        return this.stage > 9998;
    }

    getId(): number {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getTask(): Task {
        return this.data.task![this.stage];
    }

    getItem(): number | undefined {
        return this.data.itemReq?.[this.stage];
    }

    getStage(): number {
        return this.stage;
    }

    getItemReward(): ItemReward | undefined {
        return this.data.itemReward;
    }
    getDescription(): string {
        return this.description;
    }

    getInfo(): QuestInfo {
        return {
            id: this.getId(),
            name: this.getName(),
            description: this.getDescription(),
            stage: this.getStage(),
            finished: this.isFinished()
        };
    }
}
