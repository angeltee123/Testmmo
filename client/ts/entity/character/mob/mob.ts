import Character from '../character';

export default class Mob extends Character {
    hiddenName: boolean;
    level: any;
    constructor(id, kind) {
        super(id, kind);

        this.name = name;

        this.hitPoints = -1;
        this.maxHitPoints = -1;

        this.hiddenName = false;

        this.type = 'mob';
    }

    setName(name) {
        this.name = name;
    }

    hasShadow() {
        return !this.hiddenName;
    }

    drawNames() {
        return !this.hiddenName;
    }
}
