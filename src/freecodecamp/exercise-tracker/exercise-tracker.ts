import crypto from 'crypto';
import { Exercise, LogExercise } from './interfaces/exercise';
import { Log } from './interfaces/log';
import { User } from './interfaces/user';

const users = new Map<string, User>();
const exercises = new Map<User, Exercise[]>();
const logs = new Map<User, Log>();

const hashString = (str: string) => {
    const hash = crypto.createHash('sha256');
    hash.update(str);
    return hash.digest('hex');
};

export const getUsers = () => {
    return Array.from(users.values());
};

export const getUser = (userId: string) => {
    return users.get(userId);
};

export const addUser = (username: string) => {
    const hashedUsername = hashString(username);
    const existingUser = users.get(hashedUsername);
    if (!existingUser) {
        const user: User = {
            _id: hashedUsername,
            username,
        };
        const log: Log = {
            _id: hashedUsername,
            username,
            count: 0,
            logs: [],
        };
        users.set(hashedUsername, user);
        exercises.set(user, []);
        logs.set(user, log);

        return user;
    }

    return existingUser;
};

export const getExercises = (userId: string) => {
    const user = users.get(userId);
    if (!user) {
        return null;
    }

    const userExercises = exercises.get(user);
    if (!userExercises) {
        return null;
    }

    return userExercises;
};

export const addExercise = (
    userId: string,
    description: string,
    duration: number,
    date?: string,
) => {
    const user = users.get(userId);
    if (!user) {
        return null;
    }

    const userExercises = exercises.get(user);
    const userLogs = logs.get(user);
    if (!userExercises || !userLogs) {
        return null;
    }

    const newExercise: Exercise = {
        _id: user._id,
        username: user.username,
        description,
        duration,
        date: date ? new Date(date).toDateString() : new Date().toDateString(),
    };

    const newLogExercise: LogExercise = {
        description,
        duration: Number(duration),
        date: newExercise.date,
    };
    userExercises.push(newExercise);
    userLogs.logs.push(newLogExercise);
    userLogs.count += 1;

    return newExercise;
};

export const getLogs = (userId: string) => {
    const user = users.get(userId);
    if (!user) {
        return null;
    }

    const userLogs = logs.get(user);
    if (!userLogs) {
        return null;
    }

    return userLogs;
};
