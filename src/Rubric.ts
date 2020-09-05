interface Rubric {
    title?: string; 
    data?: RubricCriterion[];
    criteria: any;
}

interface RubricCriterion {
    id?: string;
    points: number;
    description: string;
    long_description: string;
    ratings: RubricRating[] | any;
}

interface RubricRating {
    id?: string;
    description: string;
    long_description: string;
    points: number;
}