import WorldContext from '../world.context';

export default class LoginContext extends WorldContext {
    constructor() {
        super();
        this.registerLookup('login button', '#login');
        this.registerLookup('username', '#login-name-input');
        this.registerLookup('password', '#login-password-input');
    }

    injectDefaultData(): void {
        super.injectDefaultPlayers();
    }

    before() {
        // Nothing needs to happen here
    }
}
