export interface ServerToClientEvents {
    noArg: () => void;
    basicEmit: (a: number, b:string, c: Buffer) => void;
    withAck: (d: string, callback: (e: number) => void) => void;
    date: (date: string) => void;
    test: (obj: {name: string, age: number}) => void;
}

export interface ClientToServerEvents {
    hello: () => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    name: string;
    age: number;
}

