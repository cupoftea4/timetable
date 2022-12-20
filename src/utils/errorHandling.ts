import { toast } from "react-toastify";

const initErrors = [
  "The creator run out of imagination, failed to initialize cache",
  "Congratulations your first loading is a failure, like you.....",
  "Congrats, you won a lottery, your cache failed to initialize with a chance of 1 to 10000000000000",
  "The creator is a lazy bum, failed to initialize cache",
  "RIP cache, you will be missed",
  "A cache is a cache, but this one is a failure",
  "Very funny, you broke the cache",
  "NULP is a failure, so is your cache",
  "Bazinga, you broke the cache"
] 

const nonexistingGroupErrors = [
  "Hello mythical creature, your group does not exist", 
  "As a mathematician I hereby name u imaginal, cause your group is not real",
  "Oh no, your group is not real, go back to Hogwarts",
  "Please, stop trying to break the app, your group does not exist",
  "Cat not found, group not found, what else is not found?",
  "Meow, your group does not exist",
  "Let me guess, you are a wizard, cause your group does not exist",
]

export const FETCH_ERROR = "Due to failed fetch u have no lectures tomorrow, go to sleep 😴";
export const DELETE_TIMETABLE_ERROR = "Couldn't delete timetable, try again later";
export const UPDATE_SUBGROUP_ERROR = "Couldn't update subgroup, try again later";
export const UNKNOWN_ERROR = "Unknown error, try again later";
export const INIT_ERROR = getRandomValue(initErrors);
export const NONEXISTING_GROUP = getRandomValue(nonexistingGroupErrors);

export const handleError = (error: string, userError: string = FETCH_ERROR) => {
  console.error(error);
  toast.error(userError);
}

function getRandomValue<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)];
}