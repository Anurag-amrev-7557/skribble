
export interface IPlayer {
    id: string;
    name: string;
    score: number;
    isDrawer: boolean;
    hasGuessed: boolean;
    avatar?: string;
}

export class Player implements IPlayer {
    public id: string;
    public name: string;
    public score: number;
    public lastTurnScore: number;
    public isDrawer: boolean;
    public hasGuessed: boolean;
    public avatar: any;

    constructor(id: string, name: string, avatar: any) {
        this.id = id;
        this.name = name;
        this.score = 0;
        this.lastTurnScore = 0;
        this.isDrawer = false;
        this.hasGuessed = false;
        this.avatar = avatar || { skinColor: "#FFDFC4", eyes: 0, mouth: 0, accessory: 0 };
    }

    resetRoundState() {
        this.isDrawer = false;
        this.hasGuessed = false;
        this.lastTurnScore = 0;
    }

    addScore(points: number) {
        this.score += points;
    }
}
