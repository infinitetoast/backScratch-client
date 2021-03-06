import {Map, fromJS} from 'immutable';
import {loop, Effects} from 'redux-loop';
import {
  getRequestedTasks,
  postTaskAssignment,
  assigneeTaskCompletion,
  requestorTaskCompletion
} from '../../services/backScratchService';

// Initial state
const initialState = Map({
  value: [],
  loading: false,
  currentTask: {
    value: {},
    loading: false
  }
});

// Actions
const TASKS_REQUEST = 'TaskState/TASKS_REQUEST';
const TASKS_RESPONSE = 'TaskState/TASKS_RESPONSE';
const SELECT_TASK = 'TaskState/SELECT_TASK';
const ASSIGN_TASK = 'TaskState/ASSIGN_TASK';
const ASSIGN_TASK_RESPONSE = 'TaskState/ASSIGN_TASK_RESPONSE';
const COMPLETE_TASK = 'TaskState/COMPLETE_TASK';
const COMPLETE_TASK_RESPONSE = 'TaskState/COMPLETE_TASK_RESPONSE';

// Action creators
export function selectTask(currTask) {
  return {
    type: SELECT_TASK,
    payload: currTask
  };
}

export function completeTask(taskId, isRequestor) {
  return {
    type: COMPLETE_TASK,
    payload: {taskId, isRequestor}
  };
}

export async function requestCompleteTask({taskId, isRequestor}) {
  return {
    type: COMPLETE_TASK_RESPONSE,
    payload: isRequestor
      ? await requestorTaskCompletion(taskId)
      : await assigneeTaskCompletion(taskId)
  };
}

export function tasks() {
  return {
    type: TASKS_REQUEST
  };
}

export async function requestTasks() {
  return {
    type: TASKS_RESPONSE,
    payload: await getRequestedTasks() // get only tasks with status 'requested'
  };
}

export function assignTask({taskId, userId}) {
  return {
    type: ASSIGN_TASK,
    payload: {taskId, userId}
  };
}

export async function requestAssignTask(assignment) {
  return {
    type: ASSIGN_TASK_RESPONSE,
    payload: await postTaskAssignment(assignment)
  };
}

// Reducer
export default function TasksStateReducer(state = initialState, action = {}) {
  switch (action.type) {
    case COMPLETE_TASK:
      return loop(
        state.set('loading', true),
        Effects.promise(requestCompleteTask, action.payload)
      );

    case COMPLETE_TASK_RESPONSE:
      return state
        .set('loading', false);
        // ---- no task being sent back from server ---
        // .set('currentTask', fromJS({
        //   value: Object.assign({}, action.payload.task.properties, {taskId: action.payload.task._id}),
        //   loading: false
        // }));

    case SELECT_TASK:
      return state
        .set('currentTask', fromJS({
          value: action.payload,
          loading: false
        }));

    case ASSIGN_TASK:
      return loop(
        state.set('loading', true),
        Effects.promise(requestAssignTask, action.payload)
      );

    case ASSIGN_TASK_RESPONSE:
      return state
        .set('loading', false);

    case TASKS_REQUEST:
      return loop(
        state.set('loading', true),
        Effects.promise(requestTasks)
      );

    case TASKS_RESPONSE:
      return state
        .set('loading', false)
        .set('value', action.payload);

    default:
      return state;
  }
}
