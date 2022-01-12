import { QuestData, RawQuest, RawStage, StageData } from '@kaetram/common/types/quest';
import NPC from '../../../../npc/npc';
import Mob from '../../../mob/mob';

export default abstract class Quest {
    /**
     * An abstract quest class that takes the raw quest data and
     * de-serializes its data into a quest object for later use.
     */

    private name = '';
    private description = '';
    private stage = 0; // How far along in the quest we are.
    private subStage = 0; // Progress in the substage (say we're tasked to kill 20 rats).
    private stageCount = 0; // How long the quest is.

    private stages: { [id: number]: RawStage } = {};

    public talkCallback?: (npc: NPC) => void;
    public killCallback?: (mob: Mob) => void;

    private progressCallback?: (key: string, stage: number, subStage: number) => void;

    public constructor(private key: string, rawData: RawQuest) {
        this.name = rawData.name;
        this.description = rawData.description;
        this.stageCount = Object.keys(rawData.stages).length;

        this.stages = rawData.stages;
    }

    /**
     * Updates the current progress of the quest. We don't use `setStage`
     * since we are going to send batch data to the client with quest data
     * upon first loading (during the login process).
     * @param stage The new stage we are setting the progress to.
     */

    public update(stage: number, subStage: number): void {
        this.stage = stage;
        this.subStage = subStage;
    }

    /**
     * Advances the quest to the next stage.
     */

    public progress(subStage?: boolean): void {
        if (subStage) this.setStage(this.stage, ++this.subStage);
        else this.setStage(++this.stage);
    }

    /**
     * A check if the quest is started or it has yet to be discovered.
     * @returns Whether the stage progress is above 0.
     */

    public isStarted(): boolean {
        return this.stage > 0;
    }

    /**
     * Checks if a quest is finished given the current progress and stage count.
     * @returns If the progress is greater or equal to stage count.
     */

    public isFinished(): boolean {
        return this.stage >= this.stageCount;
    }

    /**
     * Returns a StageData object about the current stage. It contains information about
     * what NPC the player must interact with to progress, or how many mobs to kill to
     * progress.
     * @returns StageData object containing potential npc, mob, and stage count.
     */

    public getStageData(): StageData {
        let stage = this.stages[this.stage];

        return {
            task: stage.task,
            npc: stage.npc! || '',
            mob: stage.mob! || '',
            countRequirement: stage.countRequirement! || 1
        };
    }

    /**
     * Sets the stage (and subStage if specified) and makes a callback.
     * @param stage The new stage we are setting the quest to.
     * @param subStage Optionally set the stage to a subStage index.
     */

    public setStage(stage: number, subStage = 0): void {
        this.stage = stage;
        this.subStage = subStage;

        this.progressCallback?.(this.key, this.stage, this.subStage);
    }

    /**
     * Serializes the quest's data to be stored
     * in the database. Save information such as
     * the quest key and progress.
     */

    public serialize(): QuestData {
        return {
            key: this.key,
            stage: this.stage,
            subStage: this.subStage
        };
    }

    /**
     * A callback whenever we progress the quest.
     * @param callback The quest's key and progress count;
     */

    public onProgress(callback: (key: string, stage: number, subStage: number) => void): void {
        this.progressCallback = callback;
    }

    /**
     * Callback when a talking action with an NPC occurs.
     * @param callback The NPC the interaction happens with.
     */

    public onTalk(callback: (npc: NPC) => void): void {
        this.talkCallback = callback;
    }

    /**
     * Callback for when a mob is killed.
     * @param callback The mob that is being killed.
     */

    public onKill(callback: (mob: Mob) => void): void {
        this.killCallback = callback;
    }
}
