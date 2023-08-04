import { LogExercise } from './exercise';

export interface Log {
    _id: string;
    username: string;
    count: number;
    logs: LogExercise[];
}
