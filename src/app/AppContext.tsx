import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type {
  AppData, Task, CalendarEvent, Project, Contact, Note, AppSettings, NavPage, Toast,
} from '../types';
import { loadAppData, saveAppData, generateId, hasInitialized, markInitialized } from '../services/storageService';
import { generateSeedData } from '../data/seedData';
import { nowISO } from '../utils/dateUtils';

interface AppState extends AppData {
  currentPage: NavPage;
  toasts: Toast[];
  isLoading: boolean;
}

type Action =
  | { type: 'LOAD_DATA'; payload: AppData }
  | { type: 'SET_PAGE'; payload: NavPage }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_EVENT'; payload: CalendarEvent }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'DELETE_EVENT_SERIES'; payload: string }
  | { type: 'SET_EVENTS'; payload: CalendarEvent[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: Contact }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'RESTORE_DATA'; payload: AppData }
  | { type: 'CLEAR_DATA' }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string };

function reducer(state: AppState, action: Action): AppState {
  let newState: AppState;

  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, ...action.payload, isLoading: false };
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };

    case 'ADD_TASK':
      newState = { ...state, tasks: [...state.tasks, action.payload] };
      break;
    case 'UPDATE_TASK':
      newState = { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) };
      break;
    case 'DELETE_TASK':
      newState = { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
      break;

    case 'ADD_EVENT':
      newState = { ...state, calendarEvents: [...state.calendarEvents, action.payload] };
      break;
    case 'UPDATE_EVENT':
      newState = { ...state, calendarEvents: state.calendarEvents.map(e => e.id === action.payload.id ? action.payload : e) };
      break;
    case 'DELETE_EVENT':
      newState = { ...state, calendarEvents: state.calendarEvents.filter(e => e.id !== action.payload) };
      break;
    case 'DELETE_EVENT_SERIES':
      newState = { ...state, calendarEvents: state.calendarEvents.filter(e => e.recurrenceId !== action.payload) };
      break;
    case 'SET_EVENTS':
      newState = { ...state, calendarEvents: action.payload };
      break;

    case 'ADD_PROJECT':
      newState = { ...state, projects: [...state.projects, action.payload] };
      break;
    case 'UPDATE_PROJECT':
      newState = { ...state, projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p) };
      break;
    case 'DELETE_PROJECT':
      newState = { ...state, projects: state.projects.filter(p => p.id !== action.payload) };
      break;

    case 'ADD_CONTACT':
      newState = { ...state, contacts: [...state.contacts, action.payload] };
      break;
    case 'UPDATE_CONTACT':
      newState = { ...state, contacts: state.contacts.map(c => c.id === action.payload.id ? action.payload : c) };
      break;
    case 'DELETE_CONTACT':
      newState = { ...state, contacts: state.contacts.filter(c => c.id !== action.payload) };
      break;

    case 'ADD_NOTE':
      newState = { ...state, notes: [...state.notes, action.payload] };
      break;
    case 'UPDATE_NOTE':
      newState = { ...state, notes: state.notes.map(n => n.id === action.payload.id ? action.payload : n) };
      break;
    case 'DELETE_NOTE':
      newState = { ...state, notes: state.notes.filter(n => n.id !== action.payload) };
      break;

    case 'UPDATE_SETTINGS':
      newState = { ...state, settings: { ...state.settings, ...action.payload } };
      break;

    case 'RESTORE_DATA':
      newState = { ...state, ...action.payload };
      break;
    case 'CLEAR_DATA':
      newState = {
        ...state,
        calendarEvents: [],
        tasks: [],
        projects: [],
        contacts: [],
        notes: [],
      };
      break;

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };

    default:
      return state;
  }

  saveAppData({
    schemaVersion: newState.schemaVersion,
    calendarEvents: newState.calendarEvents,
    tasks: newState.tasks,
    projects: newState.projects,
    contacts: newState.contacts,
    notes: newState.notes,
    settings: newState.settings,
  });

  return newState;
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  showToast: (type: Toast['type'], message: string, duration?: number) => void;
  navigate: (page: NavPage) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => CalendarEvent;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  deleteEventSeries: (recurrenceId: string) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Contact;
  updateContact: (contact: Contact) => void;
  deleteContact: (id: string) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const initialState: AppState = {
  schemaVersion: 1,
  calendarEvents: [],
  tasks: [],
  projects: [],
  contacts: [],
  notes: [],
  settings: {
    theme: 'dark',
    language: 'zh-HK',
    weekStartsOn: 0,
  },
  currentPage: 'dashboard',
  toasts: [],
  isLoading: true,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const data = loadAppData();

    if (!hasInitialized()) {
      const seed = generateSeedData();
      const seeded: AppData = {
        ...data,
        tasks: seed.tasks ?? [],
        calendarEvents: seed.calendarEvents ?? [],
        projects: seed.projects ?? [],
        contacts: seed.contacts ?? [],
        notes: seed.notes ?? [],
      };
      saveAppData(seeded);
      markInitialized();
      dispatch({ type: 'LOAD_DATA', payload: seeded });
    } else {
      dispatch({ type: 'LOAD_DATA', payload: data });
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const theme = state.settings.theme;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [state.settings.theme]);

  const showToast = useCallback((type: Toast['type'], message: string, duration = 3000) => {
    const id = generateId('toast');
    dispatch({ type: 'ADD_TOAST', payload: { id, type, message, duration } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), duration);
  }, []);

  const navigate = useCallback((page: NavPage) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const now = nowISO();
    const newTask: Task = { ...task, id: generateId('task'), createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_TASK', payload: newTask });
    return newTask;
  }, []);

  const updateTask = useCallback((task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: { ...task, updatedAt: nowISO() } });
  }, []);

  const deleteTask = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  }, []);

  const addEvent = useCallback((event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): CalendarEvent => {
    const now = nowISO();
    const newEvent: CalendarEvent = { ...event, id: generateId('evt'), createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_EVENT', payload: newEvent });
    return newEvent;
  }, []);

  const updateEvent = useCallback((event: CalendarEvent) => {
    dispatch({ type: 'UPDATE_EVENT', payload: { ...event, updatedAt: nowISO() } });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EVENT', payload: id });
  }, []);

  const deleteEventSeries = useCallback((recurrenceId: string) => {
    dispatch({ type: 'DELETE_EVENT_SERIES', payload: recurrenceId });
  }, []);

  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
    const now = nowISO();
    const newProject: Project = { ...project, id: generateId('proj'), createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_PROJECT', payload: newProject });
    return newProject;
  }, []);

  const updateProject = useCallback((project: Project) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...project, updatedAt: nowISO() } });
  }, []);

  const deleteProject = useCallback((id: string) => {
    dispatch({ type: 'DELETE_PROJECT', payload: id });
  }, []);

  const addContact = useCallback((contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Contact => {
    const now = nowISO();
    const newContact: Contact = { ...contact, id: generateId('contact'), createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_CONTACT', payload: newContact });
    return newContact;
  }, []);

  const updateContact = useCallback((contact: Contact) => {
    dispatch({ type: 'UPDATE_CONTACT', payload: { ...contact, updatedAt: nowISO() } });
  }, []);

  const deleteContact = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CONTACT', payload: id });
  }, []);

  const addNote = useCallback((note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const now = nowISO();
    const newNote: Note = { ...note, id: generateId('note'), createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_NOTE', payload: newNote });
    return newNote;
  }, []);

  const updateNote = useCallback((note: Note) => {
    dispatch({ type: 'UPDATE_NOTE', payload: { ...note, updatedAt: nowISO() } });
  }, []);

  const deleteNote = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NOTE', payload: id });
  }, []);

  return (
    <AppContext.Provider value={{
      state, dispatch,
      showToast, navigate,
      addTask, updateTask, deleteTask,
      addEvent, updateEvent, deleteEvent, deleteEventSeries,
      addProject, updateProject, deleteProject,
      addContact, updateContact, deleteContact,
      addNote, updateNote, deleteNote,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
