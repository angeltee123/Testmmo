import Page from '../page';
import $ from 'jquery';
import _ from 'lodash';

export default class Quest extends Page {
    constructor() {
        super('#questPage');

        this.achievements = $('#achievementList');
        this.quests = $('#questList');

        this.achievementsCount = $('#achievementCount');
        this.questCount = $('#questCount');

        this.achievementsList = this.achievements.find('ul');
        this.questList = this.quests.find('ul');

        this.finishedAchievements = 0;
        this.finishedQuests = 0;

        this.achievementsLength = 0;
        this.questsLength = 0;
    }

    loadAchievements(achievements) {
        var self = this;

        self.achievementsLength = achievements.length;

        _.each(achievements, function (achievement) {
            var item = self.getItem(false, achievement.id),
                name = self.getName(false, achievement.id);

            name.text('????????');

            name.css('background', 'rgba(255, 10, 10, 0.3)');

            if (achievement.progress > 0 && achievement.progress < 9999) {
                name.css('background', 'rgba(255, 255, 10, 0.4)');

                name.text(
                    achievement.name +
                        (achievement.count > 2
                            ? ' ' + (achievement.progress - 1) + '/' + (achievement.count - 1)
                            : '')
                );
            } else if (achievement.progress > 9998) {
                name.text(achievement.name);
                name.css('background', 'rgba(10, 255, 10, 0.3)');
            }

            if (achievement.finished) self.finishedAchievements++;

            item.append(name);

            var listItem = $('<li></li>');

            listItem.append(item);

            self.achievementsList.append(listItem);
        });

        self.updateCount();
    }

    loadQuests(quests) {
        var self = this;

        self.questsLength = quests.length;

        _.each(quests, function (quest) {
            var item = self.getItem(true, quest.id),
                name = self.getName(true, quest.id);

            name.text(quest.name);

            name.css('background', 'rgba(255, 10, 10, 0.3)');

            if (quest.stage > 0 && quest.stage < 9999)
                name.css('background', 'rgba(255, 255, 10, 0.4)');
            else if (quest.stage > 9998) name.css('background', 'rgba(10, 255, 10, 0.3)');

            if (quest.finished) self.finishedQuests++;

            item.append(name);

            var listItem = $('<li></li>');

            listItem.append(item);

            self.questList.append(listItem);
        });

        self.updateCount();
    }

    progress(info) {
        var self = this,
            item = info.isQuest ? self.getQuest(info.id) : self.getAchievement(info.id);

        if (!item) return;

        var name = item.find('' + (info.isQuest ? '#quest' : '#achievement') + info.id + 'name');

        if (!name) return;

        if (!info.isQuest && info.count > 2)
            name.text(info.name + ' ' + (info.progress - 1) + '/' + (info.count - 1));
        else name.text(info.name);

        name.css('background', 'rgba(255, 255, 10, 0.4)');

        self.updateCount();
    }

    finish(info) {
        var self = this,
            item = info.isQuest ? self.getQuest(info.id) : self.getAchievement(info.id);

        if (!item) return;

        var name = item.find('' + (info.isQuest ? '#quest' : '#achievement') + info.id + 'name');

        if (!name) return;

        if (!info.isQuest) {
            name.text(info.name);
            self.finishedAchievements++;
        }

        name.css('background', 'rgba(10, 255, 10, 0.3)');

        if (info.isQuest) self.finishedQuests++;

        self.updateCount();
    }

    updateCount() {
        var self = this;

        if (self.finishedAchievement !== 0 && self.achievementsLength !== 0)
            self.achievementsCount.html(self.finishedAchievements + '/' + self.achievementsLength);

        if (self.finishedQuests !== 0 && self.questsLength !== 0)
            self.questCount.html(self.finishedQuests + '/' + self.questsLength);
    }

    clear() {
        var self = this;

        self.achievementsList.empty();
        self.questList.empty();
    }

    getQuest(id) {
        return $(this.questList.find('li')[id]).find('#quest' + id);
    }

    getAchievement(id) {
        return $(this.achievementsList.find('li')[id]).find('#achievement' + id);
    }

    /**
     * Might as well properly organize them based
     * on their type of item and id (index).
     */

    getItem(isQuest, id) {
        return $(
            '<div id="' + (isQuest ? 'quest' : 'achievement') + id + '" class="questItem"></div>'
        );
    }

    getName(isQuest, id) {
        return $(
            '<div id="' +
                (isQuest ? 'quest' : 'achievement') +
                id +
                'name" class="questName"></div>'
        );
    }
}
