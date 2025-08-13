// types.ts

export interface User {
  id: string;
  name: string;
}

export interface ExerciseData {
  series: number;
  weight: number;
  reps: number;
  rest: string;
  progress: number; 
}

export interface Exercise {
  id: string;
  name: string;
  variant: string;
  data: ExerciseData[];
}

export interface MuscleGroup {
  id: string;
  name: string;
  frequency: number;
  exercises: Exercise[];
}

export interface Routine {
  day: string;
  muscleGroups: MuscleGroup[];
}

export interface Week {
  weekNumber: number;
  routines: Routine[];
}

export type UserProfile = {
  user: User;
  weeks: Week[];
};

