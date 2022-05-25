import _ from 'lodash';

import Game from '../game';
import Menu from '../menu/menu';

import Bank from '../menu/bank';
import Inventory from '../menu/inventory';

import { Modules, Opcodes, Packets } from '@kaetram/common/network';

export default class MenuController {
    private inventory: Inventory = new Inventory();
    private bank: Bank = new Bank();

    public menu: Menu[] = [this.inventory, this.bank];

    public constructor(private game: Game) {
        this.inventory.onSelect(this.handleInventorySelect.bind(this));
    }

    /**
     * Iterates through all menus and calls the hide function.
     * This is used when we want to hide every user interface.
     */

    public hide(): void {
        this.forEachMenu((menu: Menu) => menu.hide());
    }

    /**
     * @returns The inventory menu object.
     */

    public getInventory(): Inventory {
        return this.inventory;
    }

    /**
     * @returns The bank menu object.
     */

    public getBank(): Bank {
        return this.bank;
    }

    /**
     * Callback handler for when an item in the inventory is selected.
     * @param index Index of the item selected.
     */

    private handleInventorySelect(index: number): void {
        this.game.socket.send(Packets.Container, {
            opcode: Opcodes.Container.Select,
            type: Modules.ContainerType.Inventory,
            index
        });
    }

    /**
     * Iterates through all the menus and passes a callback.
     * @param callback Current menu being iterated through.
     */

    private forEachMenu(callback: (menu: Menu) => void): void {
        _.each(this.menu, callback);
    }
}

// import $ from 'jquery';

// import log from '../lib/log';

// import Game from '../game';

// import Actions from '../menu/actions';
// import Bank from '../menu/bank';
// import Enchant from '../menu/enchant';
// import Header from '../menu/header';
// import Inventory from '../menu/inventory';
// import Profile from '../menu/profile/profile';
// import Shop from '../menu/shop';
// import Warp from '../menu/warp';
// import Slot from '../menu/container/slot';
// import Professions from '../menu/profile/pages/professions';
// import Quest from '../menu/profile/pages/quest';

// import { Modules } from '@kaetram/common/network';
// import { SlotData } from '@kaetram/common/types/slot';

// export default class MenuController {
//     private notify = $('#notify');
//     private confirm = $('#confirm');
//     private message = $('#message');
//     private fade = $('#notify-fade');
//     private done = $('#notify-done');

//     private notification = $('#notification');
//     /** Notification title */
//     private title = $('#notification-text-title');
//     /** Notification description */
//     private description = $('#notification-text-description');

//     private notificationTimeout!: number | null;

//     private header!: Header;

//     public actions: Actions = new Actions(this);
//     public inventory: Inventory = new Inventory(this.game, this, Modules.Constants.INVENTORY_SIZE);
//     public bank: Bank = new Bank(this.game, this, Modules.Constants.BANK_SIZE);
//     public enchant: Enchant = new Enchant(this.game, this);
//     public shop: Shop = new Shop(this.game, this);
//     public warp: Warp = new Warp(this.game);

//     public profile!: Profile;

//     public constructor(public game: Game) {
//         this.done.on('click', () => this.hideNotify());
//     }

//     public resize(): void {
//         let { inventory, profile, bank, enchant, shop, header } = this;

//         inventory?.resize();

//         profile?.resize();

//         bank?.resize();

//         enchant?.resize();

//         if (shop?.isVisible()) shop.resize();

//         header?.resize();

//         this.resizeNotification();
//     }

//     public loadProfile(): void {
//         this.profile ||= new Profile(this.game);
//     }

//     public loadHeader(): void {
//         this.header ||= new Header(this.game);
//     }

//     private loadNotifications(): void {
//         let ok = $('#ok'),
//             cancel = $('#cancel'),
//             done = $('#done');

//         /**
//          * Simple warning dialogue
//          */

//         ok.on('click', () => this.hideNotify());

//         /**
//          * Callbacks responsible for
//          * Confirmation dialogues
//          */

//         cancel.on('click', () => this.hideConfirm());

//         done.on('click', () => {
//             log.info(this.confirm[0].className);

//             this.hideConfirm();
//         });
//     }

//     public stop(): void {
//         let { inventory, actions, profile, game, bank, enchant, warp, shop } = this;

//         inventory?.clear();

//         actions?.clear();

//         profile?.clean();

//         game.input.chatHandler.clear();

//         bank?.clear();

//         enchant?.clear();

//         warp?.clear();

//         shop?.clear();
//     }

//     public hideAll(): void {
//         let { inventory, actions, profile, game, bank, enchant, warp, shop } = this;

//         if (inventory?.isVisible()) inventory.hide();

//         if (actions?.isVisible()) actions.hide();

//         if (profile?.isVisible() || profile.settings.isVisible()) profile.hide();

//         game.input.chatHandler.clear();

//         if (bank?.isVisible()) bank.hide();

//         if (enchant?.isVisible()) enchant.hide();

//         if (warp?.isVisible()) warp.hide();

//         if (shop?.isVisible()) shop.hide();
//     }

//     private resizeNotification(): void {
//         let { notification } = this;

//         if (this.isNotificationVisible())
//             notification.css('top', `${window.innerHeight - notification.height()!}px`);
//     }

//     public showNotification(titleText: string, message: string, colour: string): void {
//         let { notification, description, title, notificationTimeout } = this,
//             top = window.innerHeight - notification.height()!;

//         if (this.isNotificationVisible()) {
//             this.hideNotification();

//             window.setTimeout(() => this.showNotification(titleText, message, colour), 700);

//             return;
//         }

//         title.css('color', colour);

//         title.text(titleText);
//         description.text(message);

//         notification.addClass('active');
//         notification.css('top', `${top}px`);

//         if (notificationTimeout) return;

//         this.notificationTimeout = window.setTimeout(() => this.hideNotification(), 4000);
//     }

//     private hideNotification(): void {
//         if (!this.isNotificationVisible()) return;

//         let { notificationTimeout, notification } = this;

//         clearTimeout(notificationTimeout!);
//         this.notificationTimeout = null;

//         notification.removeClass('active');
//         notification.css('top', '100%');
//     }

//     public displayNotify(text: string): void {
//         if (this.isNotifyVisible()) return;

//         let { notify, fade, message } = this;

//         notify.show();
//         fade.show();
//         message.show();

//         message.text(text);
//     }

//     public displayConfirm(message: string): void {
//         if (this.isConfirmVisible()) return;

//         this.confirm.show();
//         this.confirm.text(message);
//     }

//     private hideNotify(): void {
//         this.fade.hide();
//         this.notify.hide();
//         this.message.hide();
//     }

//     private hideConfirm(): void {
//         this.confirm.hide();
//     }

//     public getQuestPage(): Quest {
//         return this.profile.quests;
//     }

//     public getProfessionPage(): Professions {
//         return this.profile.professions;
//     }

//     public getInventorySize(): number {
//         return this.inventory ? this.inventory.size : Modules.Constants.INVENTORY_SIZE;
//     }

//     public getInventoryData(): Slot[] {
//         return this.inventory ? this.inventory.container.slots : [];
//     }

//     private isNotifyVisible(): boolean {
//         return this.notify.css('display') === 'block';
//     }

//     private isConfirmVisible(): boolean {
//         return this.confirm.css('display') === 'block';
//     }

//     private isNotificationVisible(): boolean {
//         return this.notification.hasClass('active');
//     }
// }
