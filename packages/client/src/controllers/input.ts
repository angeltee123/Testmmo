import * as Modules from '@kaetram/common/src/modules';
import Packets from '@kaetram/common/src/packets';

import Animation from '../entity/animation';
import log from '../lib/log';
import Actions from '../menu/actions';
import Chat from './chat';
import Overlay from './overlay';

import type Player from '../entity/character/player/player';
import type Entity from '../entity/entity';
import type Sprite from '../entity/sprite';
import type Game from '../game';
import type { Cursors } from '../map/map';

interface TargetData {
    sprite: Sprite;
    x: number;
    y: number;
    width: number;
    height: number;
    dx: number;
    dy: number;
    dw: number;
    dh: number;
}

export default class InputController {
    private app = this.game.app;
    private renderer = this.game.renderer;
    private map = this.game.map;

    public selectedCellVisible = false;
    private cursorVisible = true;
    public targetVisible = true;
    public selectedX = -1;
    public selectedY = -1;

    public cursor!: Sprite;
    private newCursor!: Sprite;

    public targetColour!: string;
    private newTargetColour!: string;

    public keyMovement = true;
    public cursorMoved = false;

    private cursors: { [cursor in Cursors]?: Sprite } = {};
    public lastMousePosition: Pos = { x: 0, y: 0 };

    private hovering!: number | null;
    public hoveringEntity!: Entity; // for debugging

    public mouse: Pos = { x: 0, y: 0 };

    /**
     * This is the animation for the target
     * cell spinner sprite (only on desktop)
     */
    public targetAnimation!: Animation;
    public chatHandler!: Chat;
    public overlay!: Overlay;
    private entity?: Entity;

    public constructor(private game: Game) {
        this.load();
    }

    private load(): void {
        this.targetAnimation = new Animation('move', 4, 0, 16, 16);
        this.targetAnimation.setSpeed(50);

        this.chatHandler = new Chat(this.game);
        this.overlay = new Overlay(this);
    }

    public loadCursors(): void {
        const { cursors, game } = this;

        cursors.hand = game.getSprite('hand');
        cursors.sword = game.getSprite('sword');
        cursors.loot = game.getSprite('loot');
        cursors.target = game.getSprite('target');
        cursors.arrow = game.getSprite('arrow');
        cursors.talk = game.getSprite('talk');
        cursors.spell = game.getSprite('spell');
        cursors.bow = game.getSprite('bow');
        cursors.axe = game.getSprite('axe_cursor');

        this.newCursor = cursors.hand!;
        this.newTargetColour = 'rgba(255, 255, 255, 0.5)';

        log.debug('Loaded Cursors!');
    }

    public handle(inputType: Modules.InputType, data: Modules.Keys | JQuery.Event): void {
        const { chatHandler, game } = this;
        const { menu, socket } = game;

        const player = this.getPlayer();

        switch (inputType) {
            case Modules.InputType.Key:
                if (chatHandler.isActive()) {
                    chatHandler.key(data as Modules.Keys);
                    return;
                }

                switch (data) {
                    case Modules.Keys.W:
                    case Modules.Keys.Up:
                        player.moveUp = true;

                        break;

                    case Modules.Keys.A:
                    case Modules.Keys.Left:
                        player.moveLeft = true;

                        break;

                    case Modules.Keys.S:
                    case Modules.Keys.Down:
                        player.moveDown = true;

                        break;

                    case Modules.Keys.D:
                    case Modules.Keys.Right:
                        player.moveRight = true;

                        break;

                    case Modules.Keys.Spacebar:
                        if (player.moving) break;

                        if (!player.isRanged()) break;

                        player.frozen = true;

                        this.updateFrozen(player.frozen);

                        break;

                    case Modules.Keys.Slash:
                        chatHandler.input.val('/');

                    case Modules.Keys.Enter:
                        chatHandler.toggle();

                        break;

                    case Modules.Keys.I:
                        menu.inventory?.open();

                        break;

                    case Modules.Keys.M:
                        menu.warp?.open();

                        break;

                    case Modules.Keys.P:
                        menu.profile?.open();

                        break;

                    case Modules.Keys.Esc:
                        menu.hideAll();
                        break;
                }

                break;

            case Modules.InputType.LeftClick:
                player.disableAction = false;
                this.keyMovement = false;
                this.setCoords(data as JQuery.MouseMoveEvent);

                if ((window.event as MouseEvent).ctrlKey) {
                    log.info('Control key is pressed lmao');

                    socket.send(Packets.Command, [
                        Packets.CommandOpcode.CtrlClick,
                        this.getCoords()
                    ]);
                    return;
                }

                this.leftClick(this.getCoords());

                break;

            case Modules.InputType.RightClick:
                this.rightClick(this.getCoords());

                break;
        }
    }

    public keyUp(key: Modules.Keys): void {
        const player = this.getPlayer();

        switch (key) {
            case Modules.Keys.W:
            case Modules.Keys.Up:
                player.moveUp = false;

                break;

            case Modules.Keys.A:
            case Modules.Keys.Left:
                player.moveLeft = false;

                break;

            case Modules.Keys.S:
            case Modules.Keys.Down:
                player.moveDown = false;

                break;

            case Modules.Keys.D:
            case Modules.Keys.Right:
                player.moveRight = false;

                break;

            case Modules.Keys.Spacebar:
                if (player.moving) break;

                if (!player.isRanged()) break;

                player.frozen = false;

                this.updateFrozen(player.frozen);

                break;
        }

        player.disableAction = false;
    }

    public keyMove(position: Pos): void {
        const player = this.getPlayer();

        if (!player.hasPath()) {
            this.keyMovement = true;
            this.cursorMoved = false;

            log.debug('--- keyMove ---');
            log.debug(position);
            log.debug('---------------');

            this.leftClick(position, true);
        }
    }

    private leftClick(position: Pos | undefined, keyMovement?: boolean): void {
        const { renderer, chatHandler, map, game } = this;

        const player = this.getPlayer();

        if (player.stunned || !position) return;

        this.setPassiveTarget();

        /**
         * It can be really annoying having the chat open
         * on mobile, and it is far harder to control.
         */

        if (renderer.mobile && chatHandler.input.is(':visible') && chatHandler.input.val() === '')
            chatHandler.hideInput();

        if (map.isOutOfBounds(position.x, position.y)) return;

        if (game.zoning.direction || player.disableAction) return;

        game.menu.hideAll();

        if (map.isObject(position.x, position.y)) {
            player.setObjectTarget(position.x, position.y);
            player.followPosition(position.x, position.y);

            return;
        }

        if (renderer.mobile || keyMovement)
            this.entity = game.getEntityAt(
                position.x,
                position.y,
                position.x === player.gridX && position.y === player.gridY
            );

        const { entity } = this;

        if (entity) {
            player.disableAction = true;

            this.setAttackTarget();

            if (this.isTargetable(entity)) player.setTarget(entity);

            if (player.getDistance(entity) < 7 && player.isRanged() && this.isAttackable(entity)) {
                game.socket.send(Packets.Target, [Packets.TargetOpcode.Attack, entity.id]);
                player.lookAt(entity);
                return;
            }

            if (entity.gridX === player.gridX && entity.gridY === player.gridY)
                game.socket.send(Packets.Target, [Packets.TargetOpcode.Attack, entity.id]);

            if (this.isTargetable(entity)) {
                player.follow(entity);
                return;
            }
        }

        player.removeTarget();
        player.go(position.x, position.y);
    }

    private rightClick(position: Pos | undefined): void {
        if (!position) return;

        const { renderer, game, mouse, hovering } = this;

        if (renderer.mobile)
            this.entity = game.getEntityAt(position.x, position.y, this.isSamePosition(position));

        const { entity } = this;

        if (entity) {
            const actions = this.getActions();

            actions.loadDefaults(entity.type, {
                mouseX: mouse.x,
                mouseY: mouse.y,
                pvp: entity.pvp
            });

            actions.show();
        } else if (hovering === Modules.Hovering.Object) {
            // TODO
        }
    }

    public updateCursor(): void {
        const { cursorVisible, newCursor, cursor, newTargetColour, targetColour } = this;

        if (!cursorVisible) return;

        if (newCursor !== cursor) this.cursor = newCursor;

        if (newTargetColour !== targetColour) this.targetColour = newTargetColour;
    }

    public moveCursor(): void {
        const { renderer, game, overlay, entity, map, cursors } = this;

        if (!renderer || renderer.mobile || !renderer.camera) return;

        const position = this.getCoords();
        const player = this.getPlayer();

        if (!position) return;

        // The entity we are currently hovering over.
        this.entity = game.getEntityAt(position.x, position.y, this.isSamePosition(position));

        overlay.update(entity);

        if (!entity || entity.id === player.id)
            if (map.isObject(position.x, position.y)) {
                const cursor = map.getTileCursor(position.x, position.y);

                this.setCursor(cursors[cursor || 'talk']);
                this.hovering = Modules.Hovering.Object;
            } else {
                this.setCursor(cursors.hand);
                this.hovering = null;
            }
        else
            switch (entity.type) {
                case 'item':
                case 'chest':
                    this.setCursor(cursors.loot);
                    this.hovering = Modules.Hovering.Item;
                    break;

                case 'mob':
                    this.setCursor(this.getAttackCursor());
                    this.hovering = Modules.Hovering.Mob;
                    break;

                case 'npc':
                    this.setCursor(cursors.talk);
                    this.hovering = Modules.Hovering.NPC;
                    break;

                case 'player':
                    if (entity.pvp && game.pvp) {
                        this.setCursor(this.getAttackCursor());
                        this.hovering = Modules.Hovering.Player;
                    }

                    break;
            }
    }

    public setPosition(x: number, y: number): void {
        this.selectedX = x;
        this.selectedY = y;
    }

    public setCoords(event: JQuery.MouseMoveEvent<Document>): void {
        const { app, renderer, mouse } = this;

        const offset = app.canvas.offset()!;
        const { width, height } = renderer.background;

        this.cursorMoved = false;

        mouse.x = Math.round(event.pageX - offset.left);
        mouse.y = Math.round(event.pageY - offset.top);

        if (mouse.x >= width) mouse.x = width - 1;
        else if (mouse.x <= 0) mouse.x = 0;

        if (mouse.y >= height) mouse.y = height - 1;
        else if (mouse.y <= 0) mouse.y = 0;
    }

    private setCursor(cursor: Sprite | undefined): void {
        if (cursor) this.newCursor = cursor;
        else log.error(`Cursor: ${cursor} could not be found.`);
    }

    private setAttackTarget(): void {
        this.targetAnimation.setRow(1);
    }

    public setPassiveTarget(): void {
        this.targetAnimation.setRow(0);
    }

    private getAttackCursor(): Sprite | undefined {
        return this.cursors[this.getPlayer().isRanged() ? 'bow' : 'sword'];
    }

    public getCoords(): Pos | undefined {
        const { renderer, mouse, game } = this;

        if (!renderer.camera) return;

        const tileScale = renderer.tileSize * renderer.getSuperScaling();

        const offsetX = mouse.x % tileScale;
        const offsetY = mouse.y % tileScale;

        const camera = game.getCamera();

        const x = (mouse.x - offsetX) / tileScale + camera.gridX;
        const y = (mouse.y - offsetY) / tileScale + camera.gridY;

        return { x, y };
    }

    public getTargetData(): TargetData | undefined {
        const { targetAnimation, renderer, game, selectedX, selectedY } = this;

        const sprite = game.getSprite('target');

        if (!sprite) return;

        const frame = targetAnimation.currentFrame;
        const superScale = renderer.getSuperScaling();

        if (!sprite.loaded) sprite.load();

        return {
            sprite,
            x: frame.x * superScale,
            y: frame.y * superScale,
            width: sprite.width * superScale,
            height: sprite.height * superScale,
            dx: selectedX * 16 * superScale,
            dy: selectedY * 16 * superScale,
            dw: sprite.width * superScale,
            dh: sprite.height * superScale
        };
    }

    private updateFrozen(state: boolean): void {
        this.game.socket.send(Packets.Movement, [Packets.MovementOpcode.Freeze, state]);
    }

    private isTargetable(entity: Entity): boolean {
        return this.isAttackable(entity) || entity.type === 'npc' || entity.type === 'chest';
    }

    private isAttackable(entity: Entity): boolean {
        return entity.type === 'mob' || (entity.type === 'player' && entity.pvp && this.game.pvp);
    }

    private isSamePosition(position: Pos): boolean {
        const player = this.getPlayer();

        return position.x === player.gridX && position.y === player.gridY;
    }

    public getPlayer(): Player {
        return this.game.player;
    }

    private getActions(): Actions {
        return this.game.menu.actions;
    }
}
