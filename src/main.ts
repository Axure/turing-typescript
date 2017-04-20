const logger = console;

logger.log('We are doing it');

interface TMPointer {
    kind: 'p';
    subscript: number;
}

interface TMState {
    kind: 'S';
    subscript: number;
}

interface TMLeft {
    kind: 'L';
}

interface TMRight {
    kind: 'R';
}

type TMSymbol = TMPointer
    | TMState
    | TMLeft
    | TMRight;

type TMAction = TMState | TMLeft | TMRight;

interface RaggedMap<K, V> {
    clear(): void;
    delete(key: K): boolean;
    forEach(callbackfn: (value: V, index: K, map: Map<K, V>) => void, thisArg?: any): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value?: V): this;
    readonly size: number;
}

type TMTransitionTable = RaggedMap<{
    pointer: TMPointer,
    state: TMState
}, {
    pointer: TMPointer,
    action: TMAction
}>;

class InstantDescription extends Object {

    public pointer: TMPointer;
    public pointerPosition: number;
    public states: Array<TMState>;

    toString() {
        return this.states.map((state, index) => {
            if (index !== this.pointerPosition) {
                return `S${state.subscript}`
            } else {
                return `q${this.pointer.subscript} S${state.subscript}`
            }
        }).reduce((prev, curr) => {
            return prev + ' ' + curr
        })
    }
}

const instantDescription1 = new InstantDescription();
instantDescription1.pointerPosition = 1;
instantDescription1.pointer = {
    kind: 'p', subscript: 1
};
instantDescription1.states = [
    {kind: 'S', subscript: 2},
    {kind: 'S', subscript: 5},
    {kind: 'S', subscript: 4},
    {kind: 'S', subscript: 3},
    {kind: 'S', subscript: 1},
];

logger.log(instantDescription1.toString());

const S0: TMState = {
    kind: 'S', subscript: 0
};

const S1: TMState = {
    kind: 'S', subscript: 1
};

function toString(input: TMSymbol) {
    switch (input.kind) {
        case 'S':
            return `S${input.subscript}`;
        case 'p':
            return `q${input.subscript}`;
        case 'L':
            return `L`;
        case 'R':
            return `R`;
    }
}

type HashFunction<K> = (key: K) => string;

class MapByValue<K, V> implements RaggedMap<K, V> /* implements Map<K, V> */ {

    private internalMap: Map<String, V> = new Map();
    private keys_: Array<K> = [];
    private readonly hashFunction: HashFunction<K>
    constructor(hashFunction: HashFunction<K>) {
        this.hashFunction = hashFunction;
    }

    get size(): number {
        return this.internalMap.size;
    };

    clear(): void {
        this.internalMap.clear();
    }

    delete(key: K): boolean {
        return this.internalMap.delete(this.hashFunction(key));
    }

    get(key: K): any|V {
        return this.internalMap.get(this.hashFunction(key));
    }

    has(key: K): boolean {
        return this.internalMap.has(this.hashFunction(key));
    }

    set(key: K, value?: V): this {
        if (value) {
            this.internalMap.set(this.hashFunction(key), value);
        }
        return this;
    }

    forEach(callbackfn: (value: V, index: K, map: Map<K, V>)=>void, thisArg?: any): void {
    }
}

class TuringMachine {
    private readonly transition: TMTransitionTable;

    constructor(table: TMTransitionTable) {
        this.transition = table;
        console.log(`[TM]: Our transition table`, this.transition);
    }

    public transform(before: InstantDescription): InstantDescription {
        logger.log(`[TM]: Dealing with inst. descrip.: ${before.toString()}`);
        const currentPointer = before.pointer;
        const currentState = before.states[before.pointerPosition];
        console.log(`[TM]: current pointer: `, toString(currentPointer), ', current state: ', toString(currentState));
        const nextTuple = this.transition.get({pointer: currentPointer, state: currentState});
        if (nextTuple) {
            const {pointer, action} = nextTuple;
            const result = new InstantDescription();
            result.pointer = pointer;
            result.states = before.states.slice();
            result.pointerPosition = before.pointerPosition;
            switch (action.kind) {
                case 'S':
                    result.states[result.pointerPosition] = action;
                    break;
                case 'R':
                    result.pointerPosition += 1;
                    if (result.pointerPosition == result.states.length) {
                        result.states.push(S0)
                    }
                    break;
                case 'L':
                    if (result.pointerPosition > 0) {
                        result.pointerPosition -= 1;
                    } else {
                        result.states = [S0].concat(result.states);
                    }
                    break
            }
            logger.log(`[TM]: Resulting in inst. descrip.: ${result.toString()}`);
            return result;
        } else {
            console.log(`[TM]: No feasible transition found. Halting!`);
            return before;
        }

    }
}

const B: TMState = {
    kind: 'S', subscript: 0
};

function p(subscript: number): TMPointer {
    return {
        kind: 'p', subscript
    }
}

function q(subscript: number): TMPointer {
    return {
        kind: 'p', subscript
    }
}

function S(subscript: number): TMState {
    return {
        kind: 'S', subscript
    }
}

const L: TMLeft = {
    kind: 'L'
};

const R: TMRight = {
    kind: 'R'
};



function setTuple(table: TMTransitionTable, pointer1: TMPointer, state: TMState, pointer2: TMPointer, action: TMAction) {
    table.set({
        pointer: pointer1, state
    }, {
        pointer: pointer2, action
    });
}

function pairToString(pair: {
    pointer: TMPointer,
    state: TMState
}) {
    return `${toString(pair.pointer)}_${toString(pair.state)}`
}

function buildTable(transitions: Array<[TMPointer, TMState, TMAction, TMPointer]>): TMTransitionTable {
    const result: TMTransitionTable = new MapByValue(pairToString);
    for (const transition of transitions) {
        setTuple(result, transition[0], transition[1], transition[3], transition[2])
    }
    return result;
}


const myTransitionTable: TMTransitionTable = buildTable([
    [q(1), S1, B, q(1)],
    [q(1), B, R, q(2)],
    [q(2), S1, R, q(2)],
    [q(2), B, R, q(3)],
    [q(3), S1, B, q(3)]
]);

const myMachine = new TuringMachine(myTransitionTable);

const start = new InstantDescription();
start.pointerPosition = 0;
start.pointer = q(1);
start.states = [S1, S1, B, S1, S1];

const start1 = myMachine.transform(start);
const start2 = myMachine.transform(start1);
const start3 = myMachine.transform(start2);
const start4 = myMachine.transform(start3);
const start5 = myMachine.transform(start4);
const start6 = myMachine.transform(start5);
