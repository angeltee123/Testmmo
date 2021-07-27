import _ from 'lodash';

import achievementData from '../../data/achievements.json';
import questData from '../../data/quests.json';
import Mob from '../game/entity/character/mob/mob';
import Achievement from '../game/entity/character/player/achievement';
import Player from '../game/entity/character/player/player';
import BulkySituation from '../game/entity/character/player/quests/impl/bulkysituation';
import Introduction from '../game/entity/character/player/quests/impl/introduction';
import Quest, { QuestData, QuestInfo } from '../game/entity/character/player/quests/quest';
import NPC from '../game/entity/npc/npc';

import type { AchievementData } from '../game/entity/character/player/achievement';

export interface PlayerQuests {
    username: string;
    ids: string;
    stages: string;
}

export interface PlayerAchievements {
    username: string;
    ids: string;
    progress: string;
}

export default class Quests {
    public player: Player;

    public quests: { [id: number]: Quest };
    public achievements: { [id: number]: Achievement };

    questsReadyCallback?(): void;
    achievementsReadyCallback?(): void;

    constructor(player: Player) {
        this.player = player;

        this.quests = {};
        this.achievements = {};

        this.load();
    }

    load(): void {
        let questCount = 0;

        _.each(questData, (quest) => {
            const data = quest as QuestData;

            if (questCount === 0) this.quests[quest.id] = new Introduction(this.player, data);
            else if (questCount === 1)
                this.quests[quest.id] = new BulkySituation(this.player, data);

            questCount++;
        });

        _.each(achievementData, (achievement) => {
            this.achievements[achievement.id] = new Achievement(achievement.id, this.player);
        });
    }

    updateQuests(ids: string[], stages: string[]): void {
        if (!ids || !stages) {
            _.each(this.quests, (quest: Quest) => {
                quest.load(0);
            });

            return;
        }

        for (let id = 0; id < ids.length; id++)
            if (!isNaN(parseInt(ids[id])) && this.quests[id])
                this.quests[id].load(parseInt(stages[id]));

        if (this.questsReadyCallback) this.questsReadyCallback();
    }

    updateAchievements(ids: string[], progress: string[]): void {
        for (let id = 0; id < ids.length; id++)
            if (!isNaN(parseInt(ids[id])) && this.achievements[id])
                this.achievements[id].setProgress(parseInt(progress[id]), true);

        if (this.achievementsReadyCallback) this.achievementsReadyCallback();
    }

    getQuest<Q extends Quest>(id: number): Q {
        if (id in this.quests) return this.quests[id] as Q;

        return null;
    }

    getAchievement(id: number): Achievement {
        if (!this.achievements || !this.achievements[id]) return null;

        return this.achievements[id];
    }

    getQuests(): PlayerQuests {
        let ids = '',
            stages = '';

        for (let id = 0; id < this.getQuestSize(); id++) {
            let quest = this.quests[id];

            ids += id + ' ';
            stages += quest.stage + ' ';
        }

        return {
            username: this.player.username,
            ids,
            stages
        };
    }

    getAchievements(): PlayerAchievements {
        let ids = '',
            progress = '';

        for (let id = 0; id < this.getAchievementSize(); id++) {
            ids += id + ' ';
            progress += this.achievements[id].progress + ' ';
        }

        return {
            username: this.player.username,
            ids,
            progress
        };
    }

    getAchievementData(): { achievements: AchievementData[] } {
        let achievements: AchievementData[] = [];

        this.forEachAchievement((achievement: Achievement) => {
            achievements.push(achievement.getInfo());
        });

        return {
            achievements
        };
    }

    getQuestData(): { quests: QuestInfo[] } {
        let quests: QuestInfo[] = [];

        this.forEachQuest((quest: Quest) => {
            quests.push(quest.getInfo());
        });

        return {
            quests
        };
    }

    forEachQuest(callback: (quest: Quest) => void): void {
        _.each(this.quests, (quest) => {
            callback(quest);
        });
    }

    forEachAchievement(callback: (achievement: Achievement) => void): void {
        _.each(this.achievements, (achievement) => {
            callback(achievement);
        });
    }

    getQuestsCompleted(): number {
        let count = 0;

        for (let id in this.quests)
            if (
                Object.prototype.hasOwnProperty.call(this.quests, id) &&
                this.quests[id].isFinished()
            )
                count++;

        return count;
    }

    getAchievementsCompleted(): number {
        let count = 0;

        for (let id in this.achievements)
            if (
                Object.prototype.hasOwnProperty.call(this.achievements, id) &&
                this.achievements[id].isFinished()
            )
                count++;

        return count;
    }

    getQuestSize(): number {
        return Object.keys(this.quests).length;
    }

    getAchievementSize(): number {
        return Object.keys(this.achievements).length;
    }

    getQuestByNPC(npc: NPC): Quest {
        /**
         * Iterate through the quest list in the order it has been
         * added so that NPC's that are required by multiple quests
         * follow the proper order.
         */

        for (let id in this.quests)
            if (Object.prototype.hasOwnProperty.call(this.quests, id)) {
                let quest = this.quests[id];

                if (quest.hasNPC(npc.id)) return quest;
            }

        return null;
    }

    getAchievementByNPC(npc: NPC): Achievement {
        for (let id in this.achievements)
            if (
                Object.prototype.hasOwnProperty.call(this.achievements, id) &&
                this.achievements[id].data.npc === npc.id &&
                !this.achievements[id].isFinished()
            )
                return this.achievements[id];

        return null;
    }

    getAchievementByMob(mob: Mob): Achievement {
        for (let id in this.achievements)
            if (
                Object.prototype.hasOwnProperty.call(this.achievements, id) &&
                this.achievements[id].data.mob === mob.id
            )
                return this.achievements[id];

        return null;
    }

    isQuestMob(mob: Mob): boolean {
        if (mob.type !== 'mob') return false;

        for (let id in this.quests)
            if (Object.prototype.hasOwnProperty.call(this.quests, id)) {
                let quest = this.quests[id];

                if (!quest.isFinished() && quest.hasMob(mob)) return true;
            }

        return false;
    }

    isAchievementMob(mob: Mob): boolean {
        if (mob.type !== 'mob') return false;

        for (let id in this.achievements)
            if (
                Object.prototype.hasOwnProperty.call(this.achievements, id) &&
                this.achievements[id].data.mob === mob.id &&
                !this.achievements[id].isFinished()
            )
                return true;

        return false;
    }

    isQuestNPC(npc: NPC): boolean {
        if (npc.type !== 'npc') return false;

        for (let id in this.quests)
            if (Object.prototype.hasOwnProperty.call(this.quests, id)) {
                let quest = this.quests[id];

                if (!quest.isFinished() && quest.hasNPC(npc.id)) return true;
            }

        return false;
    }

    isAchievementNPC(npc: NPC): boolean {
        if (npc.type !== 'npc') return false;

        for (let id in this.achievements)
            if (
                Object.prototype.hasOwnProperty.call(this.achievements, id) &&
                this.achievements[id].data.npc === npc.id &&
                !this.achievements[id].isFinished()
            )
                return true;

        return false;
    }

    onAchievementsReady(callback: () => void): void {
        this.achievementsReadyCallback = callback;
    }

    onQuestsReady(callback: () => void): void {
        this.questsReadyCallback = callback;
    }
}
