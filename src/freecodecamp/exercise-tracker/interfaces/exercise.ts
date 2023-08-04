export interface Exercise {
    _id: string;
    username: string;
    description: string;
    duration: number;
    date: string;
}

export interface LogExercise extends Omit<Exercise, '_id' | 'username'> {}
