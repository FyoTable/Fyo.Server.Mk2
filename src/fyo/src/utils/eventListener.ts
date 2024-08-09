export default class EventListener {
    private events: { [key: string]: Function[] } = {};

    public on(event: string, callback: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }

        this.events[event].push(callback);
    }

    protected emit(event: string, ...args: any[]) {
        if (!this.events[event]) {
            return;
        }
        this.events[event].forEach((callback) => {
            callback(...args);
        });
    }

    public removeListener(event: string, callback: Function) {
        if (!this.events[event]) {
            return;
        }

        this.events[event] = this.events[event].filter((c) => c !== callback);
    }
}